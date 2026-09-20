const OpenAI = require('openai');

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const AI_MODEL =
    process.env.OPENAI_MODEL ||
    'gpt-5.6-luna';

const HOTEL_SCHEMA = {
    type: 'object',
    additionalProperties: false,
    properties: {
        document_type: {
            type: 'string',
            enum: ['hotel_invoice'],
        },

        client_name_raw: {
            type: ['string', 'null'],
        },

        vendor_name_raw: {
            type: ['string', 'null'],
        },

        passenger_name: {
            type: ['string', 'null'],
        },

        hotel_name: {
            type: ['string', 'null'],
        },

        room_type: {
            type: ['string', 'null'],
        },

        meal: {
            type: ['string', 'null'],
        },

        check_in: {
            type: ['string', 'null'],
        },

        check_out: {
            type: ['string', 'null'],
        },

        room_quantity: {
            type: ['number', 'null'],
        },

        rate: {
            type: ['number', 'null'],
        },

        vendor_rate: {
            type: ['number', 'null'],
        },

        currency_code: {
            type: ['string', 'null'],
        },

        currency_rate: {
            type: ['number', 'null'],
        },
    },
    required: [
        'document_type',
        'client_name_raw',
        'vendor_name_raw',
        'passenger_name',
        'hotel_name',
        'room_type',
        'meal',
        'check_in',
        'check_out',
        'room_quantity',
        'rate',
        'vendor_rate',
        'currency_code',
        'currency_rate',
    ],
};

async function extractHotelInvoice(text, existingDraft = null) {
    if (!text || !String(text).trim()) {
        throw new Error('Hotel invoice message is empty.');
    }

    const systemPrompt = `
You are the hotel-invoice intake assistant for an internal travel agency ERP.

The sender is an HBA LOCAL AGENT.
The sender is NOT the customer and NOT the vendor.

The agent may write extremely short messages, informal text, abbreviations,
different line formats, spelling mistakes, missing punctuation, or mixed casing.

Your job is ONLY to extract hotel invoice information from the agent's message.

Typical example:

sell 360 za travel
buy 340 arabian travel
voco makkah
3-8 aug
quad ro
76.5

Interpret that as:

- selling rate = 360
- client account name = "za travel"
- buying rate = 340
- vendor account name = "arabian travel"
- hotel = "voco makkah"
- stay = 3 Aug through 8 Aug
- room type = Quad
- meal = RO
- ROE = 76.5
- when an ROE is supplied without another currency explicitly stated,
  default currency_code to "SAR"

IMPORTANT ACCOUNT RULE:
The client and vendor names are RAW HUMAN-PROVIDED ACCOUNT NAMES.
Do NOT invent ERP account codes.
Do NOT convert them into client/vendor suffixes.
Account matching is performed separately against the ERP account list.

IMPORTANT PASSENGER RULE:
Passenger name is mandatory for a hotel invoice.
If the agent did not provide it, passenger_name MUST be null.
Do not invent a passenger name.

IMPORTANT DEFAULTS:
- If room quantity is not stated, set room_quantity to 1.
- Do not calculate nights.
- Do not invent rates.
- Do not invent passenger names.
- Do not invent account names.
- Do not create an invoice.
- Extract only what is reasonably supported by the message.

DATE RULE:

The agent may provide dates in compact forms such as:

3-8 aug
3 to 8 aug
3-8 august
03/08 - 08/08
3 aug to 8 aug
checkin 3 aug checkout 8 aug

You MUST recognize these as a check-in/check-out date range.

When the message clearly contains a date range, extract both dates.

For a month-only date such as "3-8 aug", use the current operational
calendar context supplied by the application. Do not reject the date merely
because the year is omitted.

When you cannot determine the year safely, preserve the date information in
the extraction rather than inventing a completely unrelated date.

Never swap check-in and check-out.

MEAL EXAMPLES:
RO = Room Only
BB = Bed & Breakfast
HB = Half Board
FB = Full Board

Keep the room type and meal concise.

If an existing draft is supplied, preserve previously known values and merge
new information into it. New information should replace an old value only
when the new message clearly provides that field.
`;

    const response = await client.responses.create({
        model: AI_MODEL,

        input: [
            {
                role: 'system',
                content: [
                    {
                        type: 'input_text',
                        text: systemPrompt,
                    },
                ],
            },
            {
                role: 'user',
                content: [
                    {
                        type: 'input_text',
                        text: JSON.stringify({
                            current_draft:
                                existingDraft || {},
                            new_message:
                                String(text).trim(),
                        }),
                    },
                ],
            },
        ],

        text: {
            format: {
                type: 'json_schema',
                name: 'hotel_invoice_extraction',
                strict: true,
                schema: HOTEL_SCHEMA,
            },
        },
    });

    if (!response.output_text) {
        throw new Error(
            'OpenAI returned no hotel invoice extraction.',
        );
    }

    const result = JSON.parse(
        response.output_text,
    );

    return {
        ...result,
        document_type: 'hotel_invoice',
    };
}

module.exports = {
    extractHotelInvoice,
};