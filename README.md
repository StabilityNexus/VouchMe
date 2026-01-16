<div name="readme-top"></div>

<!-- Organization Logo -->
<div align="center" style="display: flex; align-items: center; justify-content: center; gap: 16px;">
  <img alt="Stability Nexus" src="web/public/stability.svg" width="175">
  <img src="public/todo-project-logo.svg" width="175" />
</div>

&nbsp;

<!-- Organization Name -->
<div align="center">

[![Static Badge](https://img.shields.io/badge/Stability_Nexus-/TODO-228B22?style=for-the-badge&labelColor=FFC517)](https://TODO.stability.nexus/)

<!-- Correct deployed url to be added -->

</div>

<!-- Organization/Project Social Handles -->
<p align="center">
<!-- Telegram -->
<a href="https://t.me/StabilityNexus">
<img src="https://img.shields.io/badge/Telegram-black?style=flat&logo=telegram&logoColor=white&logoSize=auto&color=24A1DE" alt="Telegram Badge"/></a>
&nbsp;&nbsp;
<!-- X (formerly Twitter) -->
<a href="https://x.com/StabilityNexus">
<img src="https://img.shields.io/twitter/follow/StabilityNexus" alt="X (formerly Twitter) Badge"/></a>
&nbsp;&nbsp;
<!-- Discord -->
<a href="https://discord.gg/YzDKeEfWtS">
<img src="https://img.shields.io/discord/995968619034984528?style=flat&logo=discord&logoColor=white&logoSize=auto&label=Discord&labelColor=5865F2&color=57F287" alt="Discord Badge"/></a>
&nbsp;&nbsp;
<!-- Medium -->
<a href="https://news.stability.nexus/">
  <img src="https://img.shields.io/badge/Medium-black?style=flat&logo=medium&logoColor=black&logoSize=auto&color=white" alt="Medium Badge"></a>
&nbsp;&nbsp;
<!-- LinkedIn -->
<a href="https://linkedin.com/company/stability-nexus">
  <img src="https://img.shields.io/badge/LinkedIn-black?style=flat&logo=LinkedIn&logoColor=white&logoSize=auto&color=0A66C2" alt="LinkedIn Badge"></a>
&nbsp;&nbsp;
<!-- Youtube -->
<a href="https://www.youtube.com/@StabilityNexus">
  <img src="https://img.shields.io/youtube/channel/subscribers/UCZOG4YhFQdlGaLugr_e5BKw?style=flat&logo=youtube&logoColor=white&logoSize=auto&labelColor=FF0000&color=FF0000" alt="Youtube Badge"></a>
</p>

---

# VouchMe

VouchMe is a blockchain-based testimonial system that enables users to provide testimonials securely and transparently, building a transparent and verifiable reputation system.

## Features

- 🔒 **Blockchain-based Testimonials** - Ensures immutable and verifiable endorsements.
- 📝 **User-friendly Interface** - Easily create, manage, and view testimonials.
- 🌐 **Decentralized Storage** - Testimonials are stored securely on-chain.
- 🔗 **Seamless Integration** - Connects easily with your wallet for authentication.

## How It Works

Follow these simple steps to start collecting and showcasing verified testimonials:

1️⃣ **Create Collection**

- Set up your personalized testimonial collection page with your address.
- Example link format: `vouch.me/[your-address]`

2️⃣ **Create Signed Testimonials**

- Testimonial givers can visit your link, create a signed testimonial, and share it with you directly via messaging apps like WhatsApp, Email, or Direct Link.

3️⃣ **Load & Showcase**

- Load the signed testimonial onto your account to display it.
- Each testimonial is **blockchain-verified** for authenticity.

## Local Setup

Follow these steps to set up VouchMe locally:

### Steps

1. **Clone the Repository**

   ```bash
   git clone https://github.com/your-username/VouchMe.git
   cd VouchMe
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Setup Environment Variables**

   - Create a `.env` file in the root directory.
   - Get your `NEXT_PUBLIC_PROJECT_ID` from [Reown Cloud](https://cloud.reown.com/).
   - Add it to the `.env` file:
     ```env
     NEXT_PUBLIC_PROJECT_ID=your_project_id_here
     ```

4. **Run the Development Server**

   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000/`.
