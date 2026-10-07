# 👟 SoleLedger — Footwear Daily Sales & 20% Profit Tracker (PWA)

A Progressive Web App (PWA) built specifically for **footwear business owners and retailers** to track daily sales, backlog past days, review monthly performance, and automatically calculate the **20% overall profit margin**.

Works **100% offline**, requires **zero database setup**, and can be installed as a native app on **Android, iPhone, iPad, and PC**.

---

## 🌟 Key Features

- ⚡ **Automatic 20% Profit Margin**: Computes gross sales, net profit (20%), and estimated inventory reinvestment cost (80%) in real time.
- 📅 **Log Past Days & Today**: Dedicated date picker and quick chips (`Today`, `Yesterday`, `2 Days Ago`) to backdate past transactions effortlessly.
- 👟 **Footwear Industry Specifics**:
  - Track **pairs sold** and calculate average price per pair.
  - Footwear category breakdown: *Sneakers & Sports*, *Formal & Office*, *Sandals & Slippers*, *Casuals*, *Women's Fashion / Heels*, *Kids & School*, *Boots*, and *Accessories & Shoe Care*.
  - Payment mode tracking: *UPI / Online*, *Cash*, *Card / POS Machine*, and *Credit / Udhaar*.
- 📊 **Monthly Analytics & Interactive SVG Chart**:
  - Full 30/31-day visual chart showing daily sales with 20% profit segments.
  - Toggle between **Daily Bars** and **Growth Curve** (cumulative sales).
  - Monthly KPIs: Total Monthly Sales, Net Profit @ 20%, Stock Cost, Total Pairs Sold, Active Days, and Best Sales Day.
- 📴 **Offline-First PWA**:
  - Pre-cached with a Service Worker (`sw.js`).
  - Stores all records securely in browser `localStorage`.
- 💼 **Business Utilities**:
  - **Export to CSV / Excel**: Download a detailed spreadsheet report with 1 click.
  - **Printable Monthly Statement**: Formats the month into a clean printable invoice/report (`Ctrl + P` / Save as PDF).
  - **JSON Backup & Restore**: Safeguard store data or transfer between devices.
  - **Customizable**: Set your store name, currency symbol (`₹`, `$`, `€`, `£`), and theme (Dark / Light).

---

## 🌐 Free 1-Click Hosting on GitHub Pages (Access from Mobile)

You can host this app for free on GitHub Pages and use it on your phone:

1. Go to your repository on GitHub: [asgarali2396-dotcom/danda](https://github.com/asgarali2396-dotcom/danda).
2. Click **Settings** (tab at the top right).
3. In the left sidebar, click **Pages**.
4. Under **Build and deployment** ➔ **Source**, select **Deploy from a branch**.
5. Under **Branch**, select `main` and folder `/ (root)`, then click **Save**.
6. Wait 1-2 minutes. Your live PWA link will be ready at:
   👉 **`https://asgarali2396-dotcom.github.io/danda/`**

---

## 📱 How to Install on Your Phone

Once opened in your mobile browser:
- **Android (Chrome)**: Tap the 3 dots menu `⋮` ➔ select **"Install app"** or **"Add to Home screen"**.
- **iPhone / iPad (Safari)**: Tap the **Share** button (box with upward arrow) ➔ select **"Add to Home Screen"**.

SoleLedger will appear as a standalone app with its shoe logo and works completely offline even without internet!

---

## 💻 Running Locally

You can run this locally without any complex dependencies using Python:

```bash
# In the project directory:
python -m http.server 8080 --bind 127.0.0.1
```

Open your browser to:
```
http://127.0.0.1:8080/
```

---

## 📁 Project Structure

```
├── index.html            # Main semantic HTML structure & modals
├── style.css             # Executive dark/light theme & responsive styling
├── app.js                # Core state, 20% profit math, SVG charts, CSV export
├── sw.js                 # Service Worker for offline PWA caching
├── manifest.webmanifest  # PWA installation manifest
├── icon.svg              # Scalable vector app icon
├── icon-192.png          # PWA home screen icon (192x192)
├── icon-512.png          # Splash screen icon (512x512)
└── README.md             # Documentation & deployment guide
```

---

*Built with ❤️ for Footwear Business Owners.*
