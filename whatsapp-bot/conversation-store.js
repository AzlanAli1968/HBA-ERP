const fs = require('fs');
const path = require('path');

const DATA_DIR =
    path.join(__dirname, 'data');

const CONVERSATION_FILE =
    path.join(
        DATA_DIR,
        'ai-conversations.json',
    );

const CONVERSATION_TTL_MS =
    2 * 60 * 60 * 1000; // 2 hours

let conversations = new Map();

function ensureDataDir() {
    fs.mkdirSync(
        DATA_DIR,
        {
            recursive: true,
        },
    );
}

function conversationKey(
    remoteJid,
    senderJid,
) {
    return `${String(remoteJid || '').trim()}::${String(senderJid || '').trim()}`;
}

function loadConversations() {
    ensureDataDir();

    if (
        !fs.existsSync(
            CONVERSATION_FILE,
        )
    ) {
        conversations = new Map();
        return;
    }

    try {
        const raw =
            fs.readFileSync(
                CONVERSATION_FILE,
                'utf8',
            );

        const parsed =
            JSON.parse(raw);

        if (
            !parsed ||
            typeof parsed !== 'object'
        ) {
            conversations = new Map();
            return;
        }

        const now =
            Date.now();

        conversations =
            new Map(
                Object.entries(parsed)
                    .filter(
                        ([, value]) => {
                            if (
                                !value ||
                                typeof value !==
                                    'object'
                            ) {
                                return false;
                            }

                            if (
                                typeof value.updatedAt !==
                                    'number'
                            ) {
                                return false;
                            }

                            return (
                                now -
                                    value.updatedAt <
                                CONVERSATION_TTL_MS
                            );
                        },
                    ),
            );
    } catch (error) {
        console.warn(
            `[AI] Could not load conversations: ${error.message}`,
        );

        conversations =
            new Map();
    }
}

function persistConversations() {
    ensureDataDir();

    const tempFile =
        `${CONVERSATION_FILE}.tmp`;

    const object =
        Object.fromEntries(
            conversations,
        );

    fs.writeFileSync(
        tempFile,
        JSON.stringify(
            object,
            null,
            2,
        ),
        'utf8',
    );

    fs.renameSync(
        tempFile,
        CONVERSATION_FILE,
    );
}

function createEmptyConversation(
    remoteJid,
    senderJid,
) {
    const now =
        Date.now();

    return {
        remoteJid:
            String(
                remoteJid || '',
            ),

        senderJid:
            String(
                senderJid || '',
            ),

        state:
            'idle',

        draft:
            null,

        awaitingField:
            null,

        awaitingConfirmation:
            false,

        lastUserMessage:
            null,

        createdAt:
            now,

        updatedAt:
            now,
    };
}

function getConversation(
    remoteJid,
    senderJid,
) {
    const key =
        conversationKey(
            remoteJid,
            senderJid,
        );

    const conversation =
        conversations.get(
            key,
        );

    if (
        !conversation
    ) {
        return null;
    }

    if (
        Date.now() -
            conversation.updatedAt >
        CONVERSATION_TTL_MS
    ) {
        conversations.delete(
            key,
        );

        persistConversations();

        return null;
    }

    return conversation;
}

function getOrCreateConversation(
    remoteJid,
    senderJid,
) {
    const existing =
        getConversation(
            remoteJid,
            senderJid,
        );

    if (
        existing
    ) {
        return existing;
    }

    const conversation =
        createEmptyConversation(
            remoteJid,
            senderJid,
        );

    conversations.set(
        conversationKey(
            remoteJid,
            senderJid,
        ),
        conversation,
    );

    persistConversations();

    return conversation;
}

function saveConversation(
    conversation,
) {
    if (
        !conversation ||
        !conversation.remoteJid ||
        !conversation.senderJid
    ) {
        throw new Error(
            'Invalid conversation.',
        );
    }

    conversation.updatedAt =
        Date.now();

    conversations.set(
        conversationKey(
            conversation.remoteJid,
            conversation.senderJid,
        ),
        conversation,
    );

    persistConversations();

    return conversation;
}

function clearConversation(
    remoteJid,
    senderJid,
) {
    conversations.delete(
        conversationKey(
            remoteJid,
            senderJid,
        ),
    );

    persistConversations();
}

function cleanupExpiredConversations() {
    const now =
        Date.now();

    let changed = false;

    for (
        const [
            key,
            conversation,
        ] of conversations
    ) {
        if (
            !conversation ||
            typeof conversation.updatedAt !==
                'number' ||
            now -
                conversation.updatedAt >
                CONVERSATION_TTL_MS
        ) {
            conversations.delete(
                key,
            );

            changed = true;
        }
    }

    if (
        changed
    ) {
        persistConversations();
    }
}

loadConversations();

module.exports = {
    conversationKey,
    createEmptyConversation,
    getConversation,
    getOrCreateConversation,
    saveConversation,
    clearConversation,
    cleanupExpiredConversations,
};