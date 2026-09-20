const ERP_BASE_URL = String(
    process.env.ERP_BASE_URL ||
        'http://127.0.0.1:8000',
).replace(/\/+$/, '');

const CACHE_TTL_MS =
    5 * 60 * 1000;

const accountCache = new Map();

/*
|--------------------------------------------------------------------------
| BASIC HELPERS
|--------------------------------------------------------------------------
*/

function getBotToken() {
    return String(
        process.env.WHATSAPP_BOT_TOKEN ||
            '',
    ).trim();
}

function normalizeAccountName(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/*
 * Convert things such as:
 *
 * z a travel
 * z.a. travel
 *
 * into:
 *
 * za travel
 *
 * This is useful for account abbreviations.
 */
function collapseSingleLetterSequences(
    value,
) {
    const tokens =
        normalizeAccountName(value)
            .split(' ')
            .filter(Boolean);

    const result = [];

    let index = 0;

    while (
        index <
        tokens.length
    ) {
        const token =
            tokens[index];

        if (
            /^[a-z]$/.test(token)
        ) {
            let combined =
                token;

            let next =
                index + 1;

            while (
                next <
                    tokens.length &&
                /^[a-z]$/.test(
                    tokens[next],
                )
            ) {
                combined +=
                    tokens[next];

                next += 1;
            }

            /*
             * Only collapse when two or more
             * single-letter tokens are together.
             */
            if (
                combined.length >=
                2
            ) {
                result.push(
                    combined,
                );

                index = next;

                continue;
            }
        }

        result.push(token);

        index += 1;
    }

    return result.join(' ');
}

function canonicalizeAccountName(
    value,
) {
    let normalized =
        collapseSingleLetterSequences(
            value,
        );

    /*
     * Normalize common plural form differences.
     *
     * travels -> travel
     * tours remains tours
     *
     * We only remove a trailing "s" from
     * sufficiently long words.
     */
    const tokens =
        normalized
            .split(' ')
            .filter(Boolean)
            .map((token) => {
                if (
                    token.length >= 5 &&
                    token.endsWith('s')
                ) {
                    return token.slice(
                        0,
                        -1,
                    );
                }

                return token;
            });

    return tokens.join(' ');
}

function tokenize(value) {
    return canonicalizeAccountName(
        value,
    )
        .split(' ')
        .filter(Boolean);
}

/*
|--------------------------------------------------------------------------
| LEVENSHTEIN
|--------------------------------------------------------------------------
*/

function levenshtein(
    a,
    b,
) {
    const left =
        String(a);

    const right =
        String(b);

    const previous =
        Array(
            right.length + 1,
        );

    const current =
        Array(
            right.length + 1,
        );

    for (
        let j = 0;
        j <= right.length;
        j += 1
    ) {
        previous[j] = j;
    }

    for (
        let i = 1;
        i <= left.length;
        i += 1
    ) {
        current[0] = i;

        for (
            let j = 1;
            j <= right.length;
            j += 1
        ) {
            const cost =
                left[i - 1] ===
                right[j - 1]
                    ? 0
                    : 1;

            current[j] =
                Math.min(
                    current[
                        j - 1
                    ] + 1,

                    previous[j] +
                        1,

                    previous[
                        j - 1
                    ] +
                        cost,
                );
        }

        for (
            let j = 0;
            j <= right.length;
            j += 1
        ) {
            previous[j] =
                current[j];
        }
    }

    return previous[
        right.length
    ];
}

function wordSimilarity(
    queryWord,
    accountWord,
) {
    const left =
        String(
            queryWord || '',
        );

    const right =
        String(
            accountWord || '',
        );

    if (
        !left ||
        !right
    ) {
        return 0;
    }

    if (
        left === right
    ) {
        return 1;
    }

    /*
     * Do NOT fuzzy-match very short words.
     *
     * This prevents:
     *
     * za -> un
     * qa -> za
     *
     * from becoming a false match.
     */
    if (
        left.length <= 2 ||
        right.length <= 2
    ) {
        return 0;
    }

    const distance =
        levenshtein(
            left,
            right,
        );

    return Math.max(
        0,
        1 -
            distance /
                Math.max(
                    left.length,
                    right.length,
                ),
    );
}

/*
|--------------------------------------------------------------------------
| ACCOUNT SCORING
|--------------------------------------------------------------------------
*/

function accountSimilarity(
    query,
    accountName,
) {
    const normalizedQuery =
        canonicalizeAccountName(
            query,
        );

    const normalizedAccount =
        canonicalizeAccountName(
            accountName,
        );

    if (
        !normalizedQuery ||
        !normalizedAccount
    ) {
        return 0;
    }

    if (
        normalizedQuery ===
        normalizedAccount
    ) {
        return 1;
    }

    const queryTokens =
        tokenize(query);

    const accountTokens =
        tokenize(accountName);

    if (
        queryTokens.length ===
            0 ||
        accountTokens.length ===
            0
    ) {
        return 0;
    }

    /*
     * ---------------------------------------------------------------
     * DISTINCTIVE TOKEN MATCHING
     * ---------------------------------------------------------------
     *
     * Every query token must have a strong match.
     *
     * Short tokens (such as ZA) require EXACT matching.
     * Longer words may tolerate spelling mistakes.
     */
    const matchedTokens =
        [];

    for (
        const queryToken of
            queryTokens
    ) {
        let bestScore =
            0;

        let bestAccountToken =
            null;

        for (
            const accountToken of
                accountTokens
        ) {
            const score =
                wordSimilarity(
                    queryToken,
                    accountToken,
                );

            if (
                score >
                bestScore
            ) {
                bestScore =
                    score;

                bestAccountToken =
                    accountToken;
            }
        }

        if (
            queryToken.length <=
            2
        ) {
            /*
             * Short code must match
             * exactly.
             */
            const exact =
                accountTokens.some(
                    (token) =>
                        token ===
                        queryToken,
                );

            if (!exact) {
                return 0;
            }

            bestScore = 1;

            bestAccountToken =
                queryToken;
        } else {
            /*
             * Normal words need a
             * reasonably strong match.
             */
            if (
                bestScore <
                0.78
            ) {
                return 0;
            }
        }

        matchedTokens.push({
            queryToken,
            accountToken:
                bestAccountToken,
            score: bestScore,
        });
    }

    /*
     * Average quality of the matched
     * distinctive words.
     */
    const averageScore =
        matchedTokens.reduce(
            (
                total,
                item,
            ) =>
                total +
                item.score,
            0,
        ) /
        matchedTokens.length;

    /*
     * Query may be a shorter version
     * of the actual registered account.
     *
     * Example:
     *
     * za travel
     * =>
     * za travel and tours
     */
    const accountContainsQuery =
        accountTokens.length >=
            queryTokens.length &&
        queryTokens.every(
            (queryToken) =>
                accountTokens.some(
                    (accountToken) =>
                        accountToken ===
                            queryToken ||
                        (
                            queryToken.length >
                                2 &&
                            wordSimilarity(
                                queryToken,
                                accountToken,
                            ) >=
                                0.82
                        ),
                ),
        );

    /*
     * Strongest case:
     *
     * ZA TRAVEL
     * is contained inside
     * ZA TRAVEL AND TOURS.
     */
    if (
        accountContainsQuery
    ) {
        return Math.min(
            1,
            averageScore +
                0.12,
        );
    }

    /*
     * Normal fuzzy match.
     */
    return averageScore;
}

/*
|--------------------------------------------------------------------------
| ERP ACCOUNT FETCH
|--------------------------------------------------------------------------
*/

async function fetchAccountsByType(
    alias,
) {
    const normalizedAlias =
        String(alias || '')
            .trim()
            .toUpperCase();

    if (
        normalizedAlias !==
            'CL' &&
        normalizedAlias !==
            'VE'
    ) {
        throw new Error(
            `Unsupported account alias: ${alias}`,
        );
    }

    const cached =
        accountCache.get(
            normalizedAlias,
        );

    if (
        cached &&
        Date.now() -
            cached.createdAt <
            CACHE_TTL_MS
    ) {
        return cached.accounts;
    }

    const token =
        getBotToken();

    if (!token) {
        throw new Error(
            'WHATSAPP_BOT_TOKEN is not configured.',
        );
    }

    const endpoint =
        `/api/whatsapp-bot/accounts/type/${encodeURIComponent(
            normalizedAlias,
        )}`;

    const response =
        await fetch(
            `${ERP_BASE_URL}${endpoint}`,
            {
                method: 'GET',

                headers: {
                    Accept:
                        'application/json',

                    Authorization:
                        `Bearer ${token}`,
                },
            },
        );

    const body =
        await response.text();

    if (!response.ok) {
        throw new Error(
            `ERP account lookup failed with HTTP ${response.status}: ${body
                .replace(
                    /\s+/g,
                    ' ',
                )
                .trim()
                .slice(
                    0,
                    1000,
                )}`,
        );
    }

    let result;

    try {
        result =
            JSON.parse(
                body,
            );
    } catch (
        error
    ) {
        throw new Error(
            'ERP returned invalid JSON for the account list.',
        );
    }

    if (
        !result?.ok ||
        !Array.isArray(
            result.accounts,
        )
    ) {
        throw new Error(
            `ERP returned an invalid ${normalizedAlias} account list.`,
        );
    }

    const accounts =
        result.accounts
            .map(
                (
                    account,
                ) => ({
                    name: String(
                        account?.name ||
                            '',
                    ).trim(),

                    last3: String(
                        account?.last3 ||
                            '',
                    ).trim(),
                }),
            )
            .filter(
                (
                    account,
                ) =>
                    account.name &&
                    /^\d{3}$/.test(
                        account.last3,
                    ),
            );

    accountCache.set(
        normalizedAlias,
        {
            accounts,
            createdAt:
                Date.now(),
        },
    );

    return accounts;
}

/*
|--------------------------------------------------------------------------
| ACCOUNT RESOLUTION
|--------------------------------------------------------------------------
*/

async function resolveAccount(
    accountName,
    alias,
) {
    const query =
        String(
            accountName || '',
        ).trim();

    if (!query) {
        return {
            status: 'missing',
            query: '',
            account: null,
            candidates: [],
        };
    }

    const accounts =
        await fetchAccountsByType(
            alias,
        );

    const scored =
        accounts
            .map(
                (
                    account,
                ) => ({
                    account,

                    score:
                        accountSimilarity(
                            query,
                            account.name,
                        ),
                }),
            )
            .filter(
                (item) =>
                    item.score >
                    0,
            )
            .sort(
                (
                    a,
                    b,
                ) =>
                    b.score -
                    a.score,
            );

    if (
        scored.length ===
        0
    ) {
        return {
            status: 'not_found',
            query,
            account: null,
            candidates: [],
        };
    }

    const top =
        scored[0];

    const second =
        scored[1] ||
        null;

    /*
     * Exact or extremely strong
     * match.
     */
    if (
        top.score >=
        0.96
    ) {
        return {
            status: 'matched',
            query,
            account:
                top.account,
            score:
                top.score,
            candidates: [],
        };
    }

    /*
     * Good fuzzy match is accepted
     * only when it is clearly ahead
     * of the next candidate.
     */
    if (
        top.score >=
            0.86 &&
        (
            !second ||
            top.score -
                second.score >=
                0.10
        )
    ) {
        return {
            status: 'matched',
            query,
            account:
                top.account,
            score:
                top.score,
            candidates: [],
        };
    }

    /*
     * Anything uncertain is returned
     * as ambiguous instead of being
     * silently selected.
     */
    const candidates =
        scored
            .filter(
                (item) =>
                    item.score >=
                    Math.max(
                        0.60,
                        top.score -
                            0.12,
                    ),
            )
            .slice(
                0,
                5,
            );

    return {
        status:
            top.score <
            0.60
                ? 'not_found'
                : 'ambiguous',

        query,

        account: null,

        score:
            top.score,

        candidates:
            candidates.map(
                (
                    item,
                ) => ({
                    name:
                        item.account
                            .name,

                    last3:
                        item.account
                            .last3,

                    score:
                        item.score,
                }),
            ),
    };
}

module.exports = {
    normalizeAccountName,
    canonicalizeAccountName,
    accountSimilarity,
    fetchAccountsByType,
    resolveAccount,
};