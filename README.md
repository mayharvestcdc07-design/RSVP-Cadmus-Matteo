# 🎉 RSVP & QR Check-in System - Cadmus Matteo

Isang modern, mobile-first, at eleganteng **RSVP & Event Check-in System** na binuo para sa pagdiriwang ni **Cadmus Matteo**. Handa na itong i-deploy sa **Render** gamit ang iyong **GitHub repository** (`mayharvestcdc07-design/RSVP-Cadmus-Matteo`).

---

## 🌟 Mga Tampok (Features)

1. **💌 Interactive Invitation & RSVP Page:**
   * Live Countdown Timer hanggang sa araw ng pagdiriwang.
   * Mga detalye ng Event (Petsa, Oras, Venue, Google Maps link).
   * RSVP Form para sa pag-confirm o pag-decline ng attendance, bilang ng upuan, dietary requirements, at mensahe/wishes.
2. **🎫 Personalized Digital Guest Pass:**
   * Bawat nag-confirm ay may sariling **Digital Pass na may QR Code** at Ticket Number (e.g. `CM-123456`).
   * Pwedeng i-save, i-print, o i-screenshot ng guest para sa mabilisang pagpasok sa reception.
3. **📷 Reception QR Scanner:**
   * Built-in camera QR scanner para sa coordinators o ushers sa entrance.
   * Instant verification at pagpapakita ng Table Number at bilang ng upuan.
   * May babala kapag na-scan na dati ang ticket upang maiwasan ang duplicate entry.
4. **📊 Organizer Admin Master Dashboard:**
   * Real-time metrics: Confirmed, Total Reserved Seats, Checked-in, at Declined.
   * Guest list manager na may live search, filter, table assignment, manual check-in toggle, at delete.
   * 💌 **Wishes & Dedication Wall** para basahin ang lahat ng pagbati para kay Cadmus Matteo.
   * 📥 **1-Click CSV / Excel Export** ng buong guest list at attendance.
   * ⚙️ **Event Settings Editor** (mababago ang title, date, time, venue, at admin PIN mula sa dashboard).
5. **⚡ Zero External Dependencies:**
   * Gumagamit ng built-in Node.js libraries kaya napakabilis mag-build at mag-deploy sa Render nang walang installation errors!

---

## 🚀 Paano I-push sa GitHub

Buksan ang terminal o PowerShell sa loob ng folder na ito (`c:\Users\mhc62\Downloads\GitHub\RSVP-Cadmus-Matteo`):

```bash
cd c:\Users\mhc62\Downloads\GitHub\RSVP-Cadmus-Matteo
git init
git remote add origin https://github.com/mayharvestcdc07-design/RSVP-Cadmus-Matteo.git
git add .
git commit -m "feat: complete RSVP and QR check-in system for Cadmus Matteo"
git branch -M main
git push -u origin main
```

---

## 🌐 Paano I-deploy sa Render (Online Deployment)

1. Pumunta sa [dashboard.render.com](https://dashboard.render.com) at mag-log in.
2. I-click ang **"New +"** (sa kanang itaas) $\rightarrow$ piliin ang **"Web Service"**.
3. I-konekta at piliin ang repository mo: **`mayharvestcdc07-design/RSVP-Cadmus-Matteo`**.
4. Ilagay ang sumusunod na settings:
   * **Name:** `rsvp-cadmus-matteo` (o anumang pangalan na nais mo)
   * **Region:** Singapore (pinakamalapit sa Pilipinas para mabilis)
   * **Branch:** `main`
   * **Runtime:** `Node`
   * **Build Command:** iwanang blanko (o ilagay ang `npm install`)
   * **Start Command:** `node server.js`
   * **Instance Type:** `Free`
5. Pindutin ang **"Deploy Web Service"**.
6. Sa loob ng 1 hanggang 2 minuto, magiging live na ang inyong website (halimbawa: `https://rsvp-cadmus-matteo.onrender.com`) na pwedeng-pwede nang i-send sa mga bisita!

---

## 🔒 Default Admin PIN
* Ang default PIN para ma-access ang Admin Dashboard ay: **`2026`**
* Maaari mo itong palitan anumang oras sa pamamagitan ng pag-click sa **"⚙️ Edit Event Details"** sa loob ng Admin Dashboard.

---

&copy; 2026 May Harvest Corporation / Cadmus Matteo Celebration. All rights reserved.
