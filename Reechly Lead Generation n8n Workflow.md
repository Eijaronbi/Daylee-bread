
# Reechly Automated Outbound Lead Generation Workflow

This n8n workflow automates the entire outbound lead generation process for Reechly, from sourcing and qualification to personalized outreach and follow-ups, focusing on high-quality Nigerian leads.

## GOAL
Automatically find, qualify, enrich, and contact high-quality Nigerian leads daily, and book meetings.

## TARGET LEADS
*   Music artists (emerging or mid-tier with active releases)
*   B2C tech startups (fintech, e-commerce, consumer apps)
*   FMCG brands (food, beverage, personal care)

---

## Workflow Structure Overview

The workflow is broken down into a main daily trigger workflow and several sub-workflows/separate workflows for reply detection and robust follow-up management.

**Main Workflow: Daily Lead Generation & Outreach**
(Runs daily to find new leads, qualify them, and initiate contact)

```mermaid
graph TD
    A[1. Cron Trigger] --> B{2. Lead Sourcing (Apify/SerpAPI)};
    B -- "New Fintech Startup" --> B1[2.1 HTTP Request: Fintech];
    B -- "New Music Release" --> B2[2.2 HTTP Request: Music];
    B -- "FMCG Brand Launch" --> B3[2.3 HTTP Request: FMCG];
    B1 --> C[3. Data Normalization];
    B2 --> C;
    B3 --> C;
    C --> D[4. AI Qualification (OpenAI)];
    D --> E{5. Filter: Qualified Leads (lead_score >= 7)};
    E -- "True (Qualified)" --> F[6. Enrichment (Hunter.io)];
    F --> G[7. Store Leads (Google Sheets/Airtable)];
    G --> H[8. AI Message Generation (OpenAI)];
    H --> I{9. Channel Selection Logic};
    I -- "Email Exists" --> J[10. Send Email (Gmail)];
    I -- "Twitter Exists" --> K[11. Send Twitter DM (HTTP)];
    I -- "Instagram Exists" --> L[11. Send Instagram DM (HTTP)];
    J --> M[Update Lead Status: Sent Initial];
    K --> M;
    L --> M;
    M --> P(15. Error Handling & Logging);
    E -- "False (Not Qualified)" --> P;
    I -- "No Channel" --> P;
```

**Auxiliary Workflow 1: Follow-Up System (Scheduled)**
(Runs daily to check for leads needing follow-ups)

```mermaid
graph TD
    A_FU[1. Cron Trigger (Daily)] --> B_FU[2. Google Sheets/Airtable: Read Leads Needing Follow-up];
    B_FU --> C_FU{3. IF: Initial Sent 2 Days Ago?};
    C_FU -- "True" --> D_FU[4. AI Message Generation (Follow-up 1)];
    D_FU --> E_FU{5. Channel Selection Logic};
    E_FU -- "Email" --> F_FU[6. Send Email (Gmail)];
    E_FU -- "Twitter" --> G_FU[7. Send Twitter DM (HTTP)];
    E_FU -- "Instagram" --> H_FU[8. Send Instagram DM (HTTP)];
    F_FU --> I_FU[9. Update Lead Status: Sent Follow-up 1];
    G_FU --> I_FU;
    H_FU --> I_FU;
    I_FU --> J_FU{10. IF: Follow-up 1 Sent 2 Days Ago?};
    J_FU -- "True" --> K_FU[11. AI Message Generation (Follow-up 2)];
    K_FU --> L_FU{12. Channel Selection Logic};
    L_FU -- "Email" --> M_FU[13. Send Email (Gmail)];
    L_FU -- "Twitter" --> N_FU[14. Send Twitter DM (HTTP)];
    L_FU -- "Instagram" --> O_FU[15. Send Instagram DM (HTTP)];
    M_FU --> P_FU[16. Update Lead Status: Sent Follow-up 2 (Final)];
    N_FU --> P_FU;
    O_FU --> P_FU;
```

**Auxiliary Workflow 2: Reply Detection & Notification**
(Runs continuously or on trigger to detect replies)

```mermaid
graph TD
    A_RD[1. Gmail Trigger: New Email] --> B_RD[2. IF: Is Reply to Outreach Email?];
    B_RD -- "True" --> C_RD[3. Update Lead Status: Replied];
    C_RD --> D_RD[4. Notification (Slack/Telegram)];
    B_RD -- "False" --> E_RD[5. Filter out irrelevant emails];
```

---

## Node-by-Node Setup (Main Workflow)

### 1. Cron Trigger Node
*   **Node Type:** Cron
*   **Description:** Starts the workflow daily.
*   **Configuration:**
    *   **Mode:** Every Day
    *   **Time:** 09:00

### 2. Lead Sourcing (HTTP Request Nodes)
*   **Node Type:** HTTP Request
*   **Description:** Uses Apify or SerpAPI to find potential leads based on specific search queries. You would typically have a dedicated Apify or SerpAPI node if available, or use the HTTP Request node to call their APIs directly. For simplicity, let's assume direct API calls. You'll likely need separate nodes or a loop for different queries.
*   **Connections:** Merge results into a single stream.

### 2.1 HTTP Request: Fintech
*   **URL:** `[Apify/SerpAPI Endpoint]`
*   **Method:** GET
*   **Headers:** `Authorization: Bearer YOUR_API_KEY`
*   **Query Parameters:**
    *   `q`: `“new fintech startup Nigeria”`
    *   `location`: `Nigeria`
    *   `num_results`: `20` (or appropriate for your API)
*   **Authentication:** API Key (or whatever your chosen service requires)

### 2.2 HTTP Request: Music
*   **URL:** `[Apify/SerpAPI Endpoint]`
*   **Method:** GET
*   **Headers:** `Authorization: Bearer YOUR_API_KEY`
*   **Query Parameters:**
    *   `q`: `“new music release Nigeria”`
    *   `location`: `Nigeria`
    *   `num_results`: `20`
*   **Authentication:** API Key

### 2.3 HTTP Request: FMCG
*   **URL:** `[Apify/SerpAPI Endpoint]`
*   **Method:** GET
*   **Headers:** `Authorization: Bearer YOUR_API_KEY`
*   **Query Parameters:**
    *   `q`: `“FMCG brand Nigeria launch”`
    *   `location`: `Nigeria`
    *   `num_results`: `20`
*   **Authentication:** API Key

### 3. Data Normalization Node
*   **Node Type:** Function
*   **Description:** Standardizes the extracted data into a consistent JSON format. This node will process the diverse outputs from different sourcing APIs.
*   **Input:** Raw data from Apify/SerpAPI (example: `item.website_data.domain`, `item.social_profiles[0].url`).
*   **Code Example:**
    ```javascript
    // Assuming 'items' contains data from the previous nodes
    const normalizedLeads = items.map(item => {
        // --- Adjust these selectors based on your actual API response structure ---
        const website = item.json.website_url || item.json.domain || '';
        const name = item.json.name || item.json.title || '';
        const category = item.json.category || (item.json.query.includes("fintech") ? "B2C Tech - Fintech" :
                        item.json.query.includes("music") ? "Music Artist" :
                        item.json.query.includes("FMCG") ? "FMCG Brand" : "Unknown");

        let instagram = '';
        let twitter = '';
        let tiktok = '';

        if (item.json.social_profiles && Array.isArray(item.json.social_profiles)) {
            item.json.social_profiles.forEach(profile => {
                if (profile.includes('instagram.com')) instagram = profile;
                if (profile.includes('twitter.com')) twitter = profile;
                if (profile.includes('tiktok.com')) tiktok = profile;
            });
        }
        // Example for followers and recent activity - will vary greatly by API
        const followers = item.json.social_stats?.total_followers || null;
        const recent_activity = item.json.recent_posts?.map(p => p.text).join('; ') || null;

        return {
            name: name,
            category: category,
            website: website,
            social_handles: {
                instagram: instagram,
                twitter: twitter,
                tiktok: tiktok
            },
            followers: followers,
            recent_activity: recent_activity
        };
    }).filter(lead => lead.name && lead.website); // Filter out leads without essential info

    return normalizedLeads;
    ```

### 4. AI Qualification Node (OpenAI)
*   **Node Type:** OpenAI (Chat Completion)
*   **Description:** Qualifies each lead based on Reechly's criteria using a custom AI prompt. Max 2 AI calls per lead for initial contact (this is the first).
*   **Input:** Data from `Data Normalization` node.
*   **Configuration:**
    *   **Model:** `gpt-3.5-turbo` (cost-effective) or `gpt-4-turbo` (higher quality)
    *   **System Message:**
        ```
        You are a growth intelligence agent working for Reechly, a performance marketing agency. Your goal is to identify high-potential leads for outreach.
        ```
    *   **User Message:**
        ```
        Analyze the following lead data for a potential client in Nigeria. Score them from 1-10 based on the criteria below. ONLY keep leads with a score >= 7.

        Scoring Criteria:
        - Urgency to grow (0-3 points): How much does this business need growth marketing right now? (e.g., new launch, recent funding, struggling to scale)
        - Ability to pay (0-2 points): Is this business likely to have a marketing budget? (e.g., established, some funding, active operations)
        - Marketing activity (0-3 points): How active are they in marketing? (e.g., running ads, active social media, content creation - indicates receptiveness)
        - Fit for Reechly (0-2 points): How well does their business model align with Reechly's expertise (music artists, B2C tech, FMCG)?

        Strictly return a JSON array containing only the qualified leads. If no leads qualify, return an empty array.
        For each qualified lead, include the following fields:

        {
          "name": "{{ $json.name }}",
          "category": "{{ $json.category }}",
          "country": "Nigeria",
          "website": "{{ $json.website }}",
          "social_handles": {
            "instagram": "{{ $json.social_handles.instagram }}",
            "twitter": "{{ $json.social_handles.twitter }}",
            "tiktok": "{{ $json.social_handles.tiktok }}"
          },
          "estimated_audience_size": "", // AI to estimate based on available info (followers, activity)
          "engagement_quality": "", // AI to summarize based on recent_activity
          "buying_signal": "", // AI to infer from urgency, activity, growth problem
          "growth_problem": "", // AI to infer potential growth pain points
          "reechly_solution": "", // AI to suggest a general Reechly solution
          "outreach_hook": "", // AI to generate a concise, personalized hook
          "lead_score": 0 // The total score
        }

        Lead Data:
        Name: {{ $json.name }}
        Category: {{ $json.category }}
        Website: {{ $json.website }}
        Social Handles: Instagram: {{ $json.social_handles.instagram }}, Twitter: {{ $json.social_handles.twitter }}, TikTok: {{ $json.social_handles.tiktok }}
        Followers: {{ $json.followers }}
        Recent Activity: {{ $json.recent_activity }}
        ```
    *   **Output Format:** JSON (set in OpenAI node)

### 5. Filter Node (IF)
*   **Node Type:** IF
*   **Description:** Filters leads based on the `lead_score` generated by AI.
*   **Configuration:**
    *   **Value 1:** `{{ $json.lead_score }}`
    *   **Operation:** `Is greater than or equal`
    *   **Value 2:** `7`
*   **Connections:** Only the "True" branch proceeds. "False" leads go to Error Handling/Logging.

### 6. Enrichment Node (Hunter.io or similar)
*   **Node Type:** HTTP Request
*   **Description:** Attempts to find a business email for the qualified lead using their website.
*   **Input:** `website` from previous node.
*   **Configuration (Hunter.io example):**
    *   **URL:** `https://api.hunter.io/v2/domain-search?domain={{ $json.website }}&api_key=YOUR_HUNTER_IO_API_KEY`
    *   **Method:** GET
    *   **Query Parameters:**
        *   `domain`: `{{ $json.website }}`
        *   `api_key`: `YOUR_HUNTER_IO_API_KEY`
*   **Data Processing (Set node after HTTP Request if needed):**
    *   Extract email: `{{ $json.data.emails[0].value }}` if exists. If multiple, pick a suitable one (e.g., `info@` or `contact@`).

### 7. Store Leads Node (Google Sheets / Airtable)
*   **Node Type:** Google Sheets (Append Row) or Airtable (Create Record)
*   **Description:** Saves qualified and enriched leads to a central database.
*   **Input:** Enriched lead data.
*   **Configuration (Google Sheets example):**
    *   **Spreadsheet ID:** `[Your Google Sheet ID]`
    *   **Sheet Name:** `Leads`
    *   **Operation:** Append Row
    *   **Map Data:**
        *   `Name`: `{{ $json.name }}`
        *   `Score`: `{{ $json.lead_score }}`
        *   `Email`: `{{ $json.email_from_hunter || '' }}`
        *   `Hook`: `{{ $json.outreach_hook }}`
        *   `Status`: `NEW`
        *   `Timestamp`: `{{ new Date().toISOString() }}`

### 8. AI Message Generation Node (OpenAI)
*   **Node Type:** OpenAI (Chat Completion)
*   **Description:** Generates personalized outreach messages for email, Twitter, and Instagram. This is the second AI call per lead.
*   **Input:** Qualified lead data with `growth_problem`, `buying_signal`, `outreach_hook`.
*   **Configuration:**
    *   **Model:** `gpt-3.5-turbo` or `gpt-4-turbo`
    *   **System Message:**
        ```
        You are an expert sales copywriter for Reechly. Your task is to craft highly personalized, concise, and compelling outreach messages.
        ```
    *   **User Message:**
        ```
        Generate a first outreach message for the following lead.
        Rules:
        - Under 50 words per message.
        - Highly personalized using the provided lead data.
        - Based on the identified growth_problem and buying_signal.
        - Start directly with the hook, no generic "Hi [Name]" intros.
        - Include a clear call to action (e.g., "Let's chat").
        - Always include this Calendly link: [YOUR_CALENDLY_LINK]

        Provide versions for:
        - Email
        - Twitter DM
        - Instagram DM

        Return STRICT JSON:
        {
          "email": "",
          "twitter_dm": "",
          "instagram_dm": ""
        }

        Lead Name: {{ $json.name }}
        Category: {{ $json.category }}
        Website: {{ $json.website }}
        Growth Problem: {{ $json.growth_problem }}
        Buying Signal: {{ $json.buying_signal }}
        Outreach Hook: {{ $json.outreach_hook }}
        ```
    *   **Output Format:** JSON

### 9. Channel Selection Logic Node (IF / Switch)
*   **Node Type:** IF (nested) or Switch
*   **Description:** Determines the primary outreach channel based on availability and preference (Email > Twitter > Instagram).
*   **Configuration (Nested IFs):**
    *   **First IF:**
        *   **Value 1:** `{{ $json.email_from_hunter || '' }}`
        *   **Operation:** `Is not empty`
        *   **True Branch:** Send Email
        *   **False Branch:** Next IF (Check Twitter)
    *   **Second IF (in False branch of first IF):**
        *   **Value 1:** `{{ $json.social_handles.twitter || '' }}`
        *   **Operation:** `Is not empty`
        *   **True Branch:** Send Twitter DM
        *   **False Branch:** Next IF (Check Instagram)
    *   **Third IF (in False branch of second IF):**
        *   **Value 1:** `{{ $json.social_handles.instagram || '' }}`
        *   **Operation:** `Is not empty`
        *   **True Branch:** Send Instagram DM
        *   **False Branch:** Skip lead (go to Error Handling/Logging)

### 10. Email Sending Node (Gmail)
*   **Node Type:** Gmail
*   **Description:** Sends the personalized email.
*   **Input:** Generated email message.
*   **Configuration:**
    *   **Resource:** Message
    *   **Operation:** Send
    *   **To:** `{{ $json.email_from_hunter }}`
    *   **Subject:** `Reechly: {{ $json.outreach_hook.substring(0, 40) }}...` (Dynamically generate)
    *   **Body:** `{{ $json.email_message_from_openai }}`
    *   **HTML:** True (if HTML email is generated, otherwise False)

### 11. DM Sending (HTTP Request for Twitter/Instagram)
*   **Node Type:** HTTP Request
*   **Description:** Sends DMs via respective platform APIs or a social media automation tool's API. This requires prior setup and authentication with those platforms.
*   **Input:** Generated DM message.
*   **Delay:** Use a `Wait` node before each DM to prevent rate limiting (30-90 seconds).

#### 11.1 Send Twitter DM
*   **Node Type:** HTTP Request
*   **Description:** Sends a Twitter DM. Requires Twitter Developer API access (v1.1 for DMs).
*   **URL:** `https://api.twitter.com/1.1/direct_messages/events/new.json`
*   **Method:** POST
*   **Headers:** `Authorization: Bearer YOUR_TWITTER_BEARER_TOKEN` (or OAuth 1.0a)
*   **Body (JSON):**
    ```json
    {
      "event": {
        "type": "message_create",
        "message_create": {
          "target": { "recipient_id": "TARGET_TWITTER_USER_ID" }, // Need to get user ID first
          "message_data": { "text": "{{ $json.twitter_dm_message_from_openai }}" }
        }
      }
    }
    ```
    *   **Note:** Getting `TARGET_TWITTER_USER_ID` from a profile URL often requires another API call. Consider if `twitter_dm` refers to tweeting *at* them if direct DM is too complex. For true DMs, this is a multi-step process. Simpler approach: use a dedicated social media tool like "Make.com" or "Zapier" which has direct integrations. If using n8n directly, you'd need additional nodes to convert username to ID.

#### 11.2 Send Instagram DM
*   **Node Type:** HTTP Request
*   **Description:** Sends an Instagram DM. Instagram API for DMs is highly restricted. This typically requires a Business Account and a custom solution or a third-party tool like ManyChat or a custom API that wraps Instagram automation.
*   **URL:** `[Your Instagram Automation Tool API Endpoint]`
*   **Method:** POST
*   **Headers:** `Authorization: Bearer YOUR_INSTAGRAM_AUTOMATION_TOKEN`
*   **Body (JSON - example for an automation tool):**
    ```json
    {
      "recipient_username": "{{ $json.social_handles.instagram_username }}",
      "message": "{{ $json.instagram_dm_message_from_openai }}"
    }
    ```
    *   **Note:** Similar to Twitter, extracting a reliable username from a URL and then sending a DM is often not straightforward directly via HTTP. Third-party tools are highly recommended here.

### M. Update Lead Status (Google Sheets / Airtable)
*   **Node Type:** Google Sheets (Update Row) or Airtable (Update Record)
*   **Description:** Marks the lead as "Sent Initial" along with the timestamp and channel used. This is crucial for follow-up logic.
*   **Configuration:**
    *   **Operation:** Update Row / Update Record
    *   **Identify by:** `Name` or unique `Lead ID` (if stored)
    *   **Set:**
        *   `Status`: `SENT_INITIAL`
        *   `Last_Contact_Date`: `{{ new Date().toISOString() }}`
        *   `Channel_Used`: `Email` / `Twitter DM` / `Instagram DM`

### P. Error Handling & Logging Node
*   **Node Type:** Google Sheets (Append Row), Log, or Webhook (for alert)
*   **Description:** Catches errors, logs unqualified leads, or leads for which no channel was found.
*   **Configuration (Google Sheets example for unqualified/skipped leads):**
    *   **Spreadsheet ID:** `[Your Error Log Sheet ID]`
    *   **Sheet Name:** `Failed Leads`
    *   **Operation:** Append Row
    *   **Map Data:**
        *   `Name`: `{{ $json.name }}`
        *   `Status`: `NOT_QUALIFIED` / `NO_CHANNEL_FOUND` / `ERROR_OCCURRED`
        *   `Details`: `{{ $error.message || $json.lead_score || 'N/A' }}`
        *   `Timestamp`: `{{ new Date().toISOString() }}`

---

## Auxiliary Workflow 1: Follow-Up System

This workflow runs daily to check for leads needing follow-ups.

### 1. Cron Trigger Node
*   **Node Type:** Cron
*   **Configuration:** Daily, e.g., 10:00 AM (after initial outreach).

### 2. Google Sheets/Airtable: Read Leads Needing Follow-up
*   **Node Type:** Google Sheets (Get Many) / Airtable (List Records)
*   **Configuration:**
    *   **Sheet Name:** `Leads`
    *   **Filters:**
        *   `Status` = `SENT_INITIAL` AND `Last_Contact_Date` is 2 days ago.
        *   `Status` = `SENT_FOLLOWUP1` AND `Last_Contact_Date` is 2 days ago.

### 3. IF: Initial Sent 2 Days Ago?
*   **Node Type:** IF
*   **Description:** Checks if `Status` is `SENT_INITIAL` and `Last_Contact_Date` is exactly 2 days ago.
*   **True Branch:** Proceed to Follow-up 1.
*   **False Branch:** Proceed to next IF (Check for Follow-up 1 sent 2 days ago).

### 4. AI Message Generation (Follow-up 1)
*   **Node Type:** OpenAI (Chat Completion)
*   **Description:** Generates a shorter follow-up message with a new angle.
*   **Configuration:** Similar to initial message generation, but prompt tailored for follow-up:
    *   **User Message:**
        ```
        Generate a first follow-up message for {{ $json.name }}.
        Rules:
        - Under 30 words.
        - Add a new angle or insight related to their {{ $json.growth_problem }}.
        - Reference the previous outreach subtly (e.g., "Just circling back...").
        - Always include this Calendly link: [YOUR_CALENDLY_LINK]

        Lead Name: {{ $json.name }}
        Growth Problem: {{ $json.growth_problem }}
        Outreach Hook: {{ $json.outreach_hook }}
        Previous Message Context: {{ $json.email_message_from_openai_initial }} // Pass initial message or key points
        ```

### 5-8. Channel Selection & Sending (Follow-up 1)
*   **Node Type:** IF, Gmail, HTTP Request
*   **Description:** Uses the `Channel_Used` from the initial outreach to send the follow-up on the same channel.
*   **Configuration:** Similar to initial channel selection and sending, but use the `Channel_Used` field.

### 9. Update Lead Status: Sent Follow-up 1
*   **Node Type:** Google Sheets/Airtable (Update Row/Record)
*   **Configuration:** Set `Status` to `SENT_FOLLOWUP1`, update `Last_Contact_Date`.

### 10. IF: Follow-up 1 Sent 2 Days Ago?
*   **Node Type:** IF
*   **Description:** Checks if `Status` is `SENT_FOLLOWUP1` and `Last_Contact_Date` is exactly 2 days ago.
*   **True Branch:** Proceed to Follow-up 2.
*   **False Branch:** End of workflow for this lead.

### 11. AI Message Generation (Follow-up 2)
*   **Node Type:** OpenAI (Chat Completion)
*   **Description:** Generates a final, shorter follow-up with a last new angle.
*   **Configuration:** Similar to Follow-up 1, but prompt tailored for final follow-up:
    *   **User Message:**
        ```
        Generate a final follow-up message for {{ $json.name }}.
        Rules:
        - Under 20 words.
        - Add a final, concise value proposition or call to action.
        - Offer a clear "no pressure" exit.
        - Always include this Calendly link: [YOUR_CALENDLY_LINK]
        ```

### 12-15. Channel Selection & Sending (Follow-up 2)
*   **Node Type:** IF, Gmail, HTTP Request
*   **Description:** Sends the final follow-up on the same channel.

### 16. Update Lead Status: Sent Follow-up 2 (Final)
*   **Node Type:** Google Sheets/Airtable (Update Row/Record)
*   **Configuration:** Set `Status` to `SENT_FOLLOWUP2_FINAL`, update `Last_Contact_Date`.

---

## Auxiliary Workflow 2: Reply Detection & Notification

### 1. Gmail Trigger: New Email
*   **Node Type:** Gmail Trigger
*   **Configuration:**
    *   **Watch for:** New Email
    *   **Folders:** `Inbox`
    *   **Filter:** Potentially filter by `From` or `Subject` keywords if possible to reduce noise.

### 2. IF: Is Reply to Outreach Email?
*   **Node Type:** IF
*   **Description:** Checks if the incoming email is a reply to one of your outreach emails. This can be complex.
*   **Configuration:**
    *   **Value 1:** `{{ $json.from.email }}`
    *   **Operation:** `Is in` (List of emails from your `Leads` sheet)
    *   **AND/OR**
    *   **Value 1:** `{{ $json.subject }}`
    *   **Operation:** `Contains` (e.g., "Re: Reechly", or check for `In-Reply-To` header matching an `Message-ID` of sent email).
    *   **Alternatively:** Store a unique `Message-ID` of your sent emails with the lead, and check if the incoming email's `References` or `In-Reply-To` headers match. This is more robust but requires storing those IDs.

### 3. Update Lead Status: Replied
*   **Node Type:** Google Sheets/Airtable (Update Row/Record)
*   **Description:** Marks the lead as "Replied" in your CRM.
*   **Configuration:** Set `Status` to `REPLIED`, `Reply_Date` to `{{ new Date().toISOString() }}`.

### 4. Notification Node (Slack/Telegram)
*   **Node Type:** Slack (Send Message) or Telegram (Send Message)
*   **Description:** Notifies your team about a new reply.
*   **Configuration (Slack example):**
    *   **Channel:** `[Your Sales Channel]`
    *   **Text:** `New reply from {{ $json.from.name }} ({{ $json.from.email }}) for lead: {{ $json.lead_name_from_db }}. Subject: {{ $json.subject }}. See lead in CRM: [Link to Lead in Google Sheets]`

---

## Data Flow Explanation

1.  **Trigger & Sourcing**: The daily Cron starts the workflow. Multiple HTTP requests fetch raw lead data from various sources (Apify, SerpAPI). This data comes in varied formats.
2.  **Normalization**: A Function node acts as a crucial data standardization layer, transforming the disparate raw data into a consistent, predefined JSON structure. This makes subsequent nodes easier to configure.
3.  **AI Qualification**: The OpenAI node consumes the normalized data. It applies sophisticated logic to score each lead, enriching it with Reechly-specific insights like `growth_problem`, `buying_signal`, and an `outreach_hook`. Critically, it *filters out* low-quality leads, ensuring only high-potential leads proceed.
4.  **Enrichment**: Qualified leads then pass through an HTTP Request node (e.g., Hunter.io) to attempt to find an associated business email address.
5.  **Storage**: All qualified and enriched leads are saved to Google Sheets/Airtable. This serves as your CRM, tracking lead status, contact info, and critical AI-generated insights.
6.  **AI Message Generation**: For each saved lead, another OpenAI call crafts highly personalized and concise outreach messages tailored for different channels (email, Twitter, Instagram), leveraging the `growth_problem` and `buying_signal` identified earlier. This is the final AI call for *initial* outreach.
7.  **Channel Selection & Outreach**: An IF/Switch logic node intelligently selects the most suitable outreach channel based on available contact information (email preferred, then Twitter, then Instagram). The corresponding Gmail or HTTP Request node then sends the message.
8.  **Status Update**: After successful initial outreach, the lead's status in Google Sheets/Airtable is updated to `SENT_INITIAL` with a timestamp and the channel used. This is vital for the follow-up system.
9.  **Follow-up System (Auxiliary Workflow)**: A separate daily Cron-triggered workflow queries the CRM for leads requiring follow-ups (2 days after initial, then 2 days after first follow-up). It uses AI to generate new, short messages with fresh angles and sends them via the same channel as the initial outreach.
10. **Reply Detection (Auxiliary Workflow)**: A continuous Gmail Trigger monitors for replies. When a reply is detected from an existing lead, the CRM status is updated, and a notification is sent to the team.
11. **Error Handling**: Throughout the main workflow, unqualified leads or leads without an outreach channel are directed to an error logging mechanism (e.g., a dedicated Google Sheet). Individual nodes should also have retry mechanisms configured.

---
