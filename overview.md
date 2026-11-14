# Splitwise Clone — Simple Project Overview & Block Diagrams

> **What is this guide?**  
> This guide explains the entire Splitwise project in **simple, plain English** using **clean and easy-to-understand block diagrams**.  
> If you need to explain this project to an interviewer, recruiter, or colleague without getting lost in complicated jargon, this is your reference.

---

## 1. What Does This Project Do? (The Big Idea)

Imagine 3 friends—**Alice, Bob, and Charlie**—go on a weekend road trip:
- Alice pays **\$120** for petrol.
- Bob pays **\$90** for groceries.
- Charlie pays **\$60** for snacks.

At the end of the trip, who owes what to whom?
Without an app, calculating this gets messy with multiple transfers back and forth.

**Our Splitwise Application solves this completely:**
1. **Tracks Expenses**: Members log who paid and who participated.
2. **Splits Fairly**: Evenly, by exact amounts, percentages, or shares (down to the exact penny, with zero lost cents).
3. **Simplifies Debts**: Turns a confusing web of 10 different debts into **just 2 or 3 simple payments**.
4. **Instant Chat**: Members talk inside the group with live typing indicators and read receipts.
5. **Dual Currency**: Shows prices in Indian Rupees (**₹**) and automatic US Dollars (**\$**).
6. **Dark & Light Mode**: Seamless theme switching with zero page flash.

---

## 2. High-Level Architecture (The Big Picture)

Here is how the entire system connects from the user's screen down to the database:

```mermaid
flowchart TD
    User(["👤 User on Laptop or Mobile"])

    subgraph FrontendLayer ["1. Frontend (React 18 + Tailwind CSS + Zustand)"]
        UI["🖥️ Web Pages (Dashboard, Groups, Chat, Expense Modal)"]
        State["📦 Zustand Stores (Auth, Theme, Dual Currency)"]
        HTTPClient["📡 Axios Client (Attaches JWT Token)"]
        WSClient["⚡ STOMP WebSocket Client (Live Chat & Typing)"]
    end

    subgraph BackendLayer ["2. Backend (Spring Boot 3.3 + Java 21 LTS)"]
        Security["🛡️ Security Filter (Checks JWT & Group Access)"]
        Controllers["🎯 REST Controllers (Handle Requests)"]
        Services["⚙️ Business Logic (Splits, Balances, Algorithms)"]
        WSBroker["📬 WebSocket Message Broker (Real-time Relay)"]
    end

    subgraph StorageLayer ["3. Database & Storage"]
        MySQL[("🗄️ MySQL Database (DECIMAL 19,4 Money Storage)")]
        Disk[("📁 File Storage (Receipt Images & Avatars)")]
    end

    User <--> UI
    UI <--> State
    State --> HTTPClient
    State --> WSClient

    HTTPClient <-->|REST API Requests & Responses| Security
    Security <--> Controllers
    Controllers <--> Services

    WSClient <-->|Live WebSocket Events| WSBroker
    WSBroker <--> Services

    Services <--> MySQL
    Services <--> Disk
```

### Simple Explanation of the 3 Layers:
1. **Frontend (Browser)**: The visual user interface built with React. It handles user clicks, displays numbers in ₹ and \$, and updates the screen instantly.
2. **Backend (Server)**: The brain built with Spring Boot and Java 21. It verifies passwords, calculates splits with financial accuracy, simplifies debts, and protects private data.
3. **Database (MySQL)**: The memory. It safely stores users, groups, expenses, and chat messages. Money is stored in `DECIMAL(19,4)` so no floating-point rounding errors ever occur.

---

## 3. How User Authentication Works (Sign In & Security)

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 User
    participant Browser as 🖥️ Frontend (React)
    participant Server as 🛡️ Backend (Spring Boot)
    participant DB as 🗄️ MySQL Database

    User->>Browser: Enters email & password
    Browser->>Server: POST /api/v1/auth/login
    Server->>DB: Find user by email
    DB-->>Server: Return hashed password (BCrypt)
    Server->>Server: Verify password match
    Server-->>Browser: Return JWT Access Token (15 min) + Refresh Token (7 days)
    Browser->>Browser: Save tokens in localStorage
    Browser-->>User: Redirect to Dashboard!
```

### In Plain Words:
- You type your email and password.
- The server checks if your password matches the encrypted hash in the database.
- The server hands back a **digital VIP badge (JWT Token)**.
- Every time you click something, your browser shows this badge so the server knows who you are.

---

## 4. How Adding an Expense Works (Step-by-Step)

Here is what happens when someone clicks **"Add Expense"**:

```mermaid
flowchart TD
    A["👤 User enters expense: '$90 for Dinner'"] --> B["Select Split Type:
    - Equal
    - Exact
    - Percentage
    - Shares"]

    B --> C["Select Payers (Who paid? Alice: $60, Bob: $30)"]
    C --> D["🖥️ Frontend Validates:
    Does sum of payers ($90) == total ($90)?"]

    D -->|YES| E["📡 Send to Backend: POST /groups/{id}/expenses"]
    D -->|NO| Err["❌ Show Inline Error to User"]

    E --> F["⚙️ Strategy Pattern calculates each person's exact share"]
    F --> G["Penny Distribution (distributes any odd cents fairly)"]
    G --> H["🗄️ Save Expense, Payers, and Splits to MySQL"]
    H --> I["🔄 Recalculate Group Net Balances"]
    I --> J["✅ Return Updated Group Data to Frontend"]
```

### The Penny Distribution Trick (Explained Simply):
What happens if 3 roommates split a **\$100.00** grocery bill equally?
- In basic math: $100 \div 3 = 33.333333...$
- If everyone pays \$33.33: $33.33 \times 3 = \$99.99$. **Where did the 1 cent go?**
- **Our Solution**:
  - Person 1 pays: **\$33.34**
  - Person 2 pays: **\$33.33**
  - Person 3 pays: **\$33.33**
  - $\text{Total} = \mathbf{\$100.00}$ exactly! Not a single cent is ever lost.

---

## 5. How Debt Simplification Works (The Min-Cash-Flow Algorithm)

This is the most impressive algorithm in Splitwise. Here is how it turns messy debts into minimal payments:

### Before Simplification (Messy Web of Debts):
Without simplification, 3 people might have 3 separate debts:
- Alice owes Bob **\$20**
- Bob owes Charlie **\$20**
- Charlie owes Alice **\$10**

### The Concept: Calculate Net Balance First
Instead of looking at pairwise IOUs, the system calculates everyone's **Net Balance**:
$$\text{Net Balance} = \text{Total Paid} - \text{Total Owed}$$

| Person | Total Paid | Total Owed | Net Balance | Role |
|---|---|---|---|---|
| **Alice** | \$60 | \$20 | **+\$40** | **Creditor** (should receive \$40) |
| **Bob** | \$20 | \$30 | **-\$10** | **Debtor** (owes \$10) |
| **Charlie** | \$10 | \$40 | **-\$30** | **Debtor** (owes \$30) |

Notice: $+40 + (-10) + (-30) = 0$. Money is always conserved!

### The Algorithm (Greedy Max-Heap Flow):

```mermaid
flowchart LR
    subgraph Debtors ["Debtors (Owe Money)"]
        Charlie["Charlie owes $30"]
        Bob["Bob owes $10"]
    end

    subgraph Creditors ["Creditors (Need Money)"]
        Alice["Alice needs $40"]
    end

    Charlie -->|"Payment 1: $30"| Alice
    Bob -->|"Payment 2: $10"| Alice
```

### Result:
- **Transaction 1**: Charlie pays Alice **\$30**. (Charlie is done!). Alice now only needs \$10.
- **Transaction 2**: Bob pays Alice **\$10**. (Bob is done! Alice has received all \$40!).
- **Everyone is settled with only 2 transactions instead of a confusing web!**

---

## 6. How Real-Time Group Chat Works

When friends are inside a group, they can chat, see who is typing, and see who read their messages in real time.

```mermaid
sequenceDiagram
    autonumber
    actor Alice as 👤 Alice
    participant FrontAlice as 🖥️ Alice's Screen
    participant Broker as ⚡ WebSocket Server (STOMP)
    participant FrontBob as 🖥️ Bob's Screen
    actor Bob as 👤 Bob

    Alice->>FrontAlice: Types "I just paid for lunch!"
    FrontAlice->>Broker: SEND /app/groups/5/typing { isTyping: true }
    Broker-->>FrontBob: Broadcast typing indicator
    FrontBob-->>Bob: Displays "Alice is typing..."

    Alice->>FrontAlice: Hits Enter (Send)
    FrontAlice->>Broker: SEND /app/groups/5/chat { message: "I just paid for lunch!" }
    Broker->>Broker: Save to MySQL database
    Broker-->>FrontBob: Broadcast new message to /topic/groups/5/chat
    FrontBob-->>Bob: Renders chat bubble on screen

    Bob->>FrontBob: Reads message
    FrontBob->>Broker: SEND /app/groups/5/read { messageId: 42 }
    Broker-->>FrontAlice: Broadcast read receipt
    FrontAlice-->>Alice: Shows Double Green/Blue Checkmark (✓✓)
```

---

## 7. Dual Currency Engine (₹ INR & $ USD)

Whenever an Indian Rupee (INR) amount is displayed, the app automatically calculates and shows the US Dollar ($) equivalent right beside it:

```mermaid
flowchart TD
    RawAmount["₹2,500.00 (Indian Rupees)"] --> Converter["currencyUtils: amount / 84.00"]
    Converter --> DualFormat["formatDualCurrency()"]
    DualFormat --> Output["₹2,500.00 (~$29.76)"]
```

- **Seamless**: Converted dynamically without layout shifting.
- **Phone Prefix**: Selecting INR automatically adds **`+91 `** to the phone number input; selecting USD sets **`+1 `**.
- **Field Placeholders**: Placeholders use clean field identifiers (`username`, `group_name`, `expense_title`, `password`) instead of hardcoded sample names.

---

## 8. Technology Stack Summary (Simple Table)

| Layer | Technology | Why We Used It (In 1 Sentence) |
|---|---|---|
| **Frontend UI** | **React 18 + TypeScript** | Type-safe, component-driven UI that renders quickly without errors. |
| **Styling** | **Tailwind CSS** | Clean modern utility styles with instant Dark and Light mode support. |
| **State Management** | **Zustand** | Ultra-lightweight (1.1 KB) store with zero boilerplate and no re-render lag. |
| **Backend API** | **Java 21 + Spring Boot 3.3** | High-performance enterprise platform with rock-solid stability. |
| **Security** | **Spring Security 6 + JWT** | Protects endpoints and ensures users can only see their own groups (Anti-IDOR). |
| **Real-Time** | **STOMP over WebSocket** | Delivers instant chat messages, typing events, and read receipts. |
| **Database** | **MySQL 8.0** | Reliable ACID database using `DECIMAL(19,4)` so balances are never lost. |
| **Design Patterns** | **Strategy Pattern** | Allows adding new split types (Equal, Exact, %, Shares) cleanly without rewriting code. |

---

## 9. Quick 5-Point Summary to Memorize for Interviews

1. **Architecture**: It is a full-stack **Modular Monolith** using **React 18** on the frontend and **Spring Boot 3.3 (Java 21)** on the backend.
2. **Financial Precision**: Money is never stored as `float` or `double`. We use Java's **`BigDecimal`** and MySQL's **`DECIMAL(19,4)`** with odd-penny distribution to prevent any monetary rounding errors.
3. **Debt Simplification**: We use a **Greedy Dual Max-Heap Min-Cash-Flow algorithm** that takes $O(N^2)$ complex pairwise debts and reduces them to at most $N-1$ simple payments.
4. **Real-Time Features**: Group chat, typing presence, and read receipts run on **WebSocket + STOMP** protected by custom Spring Security interceptors.
5. **Modern UX**: Features instant **Dark/Light mode**, **Dual Currency (₹ INR + \$ USD)**, and safe **Axios 401 token refresh queuing**.

