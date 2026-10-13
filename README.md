# NaoX

## Decentralized AI-Powered Finance, Gaming, and Social Interaction Ecosystem

> NaoX is a next-generation ecosystem built on the **NaoX Protocol**, using decentralized AI. It supports multiple blockchains like **Ethereum (EVM)**, **Solana**, and more. Play-to-Earn (P2E) mechanics let you earn real crypto rewards.

---

## Current Features

- **Decentralized AI**
- **Multi-Chain Support**: Play on **Ethereum (EVM)**, **Solana**, and other supported blockchains. Your assets and rewards can move between chains.
- **Play-to-Earn (P2E)**: Earn real **crypto rewards** while playing. Rewards are powered by the NaoX's AI to make payouts fair.
- **NFT Avatars**: Create and use **NFT avatars**, supported on Ethereum, and other networks.
- **On-Chain Game Logic**: All gameplay is controlled by smart contracts.
- **Token Integration**: Stake and earn with native tokens across different blockchains.
- **Mobile and Desktop Ready**: The platform works on both **desktop** and **mobile** devices.

---

## Coming Soon

- **More Games**: New games like **Blackjack**, **Roulette**, **Slots**, and others. All powered by decentralized AI.
- **Tournaments**: Compete in cross-chain tournaments with prize pools. AI will manage the events and rewards.
- **Social Features**: Chat, add friends, and interact with other players across different blockchains.
- **Better P2E**: Improved reward systems that will work across all blockchains with the help of AI.


[![React](https://img.shields.io/badge/React-16.13.1-61dafb?logo=react)](#)
[![Node.js](https://img.shields.io/badge/Node.js-Express-43853d?logo=node.js)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9-blue?logo=typescript)](#)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?logo=mongodb)](#)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8.1-black?logo=socket.io)](#)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5.1.3-purple?logo=bootstrap)](#)
[![Styled Components](https://img.shields.io/badge/Styled_Components-5.1.1-DB7093?logo=styled-components)](#)
[![Axios](https://img.shields.io/badge/Axios-1.4.0-5A29E4?logo=axios)](#)


## Quick Start

```bash
git clone <git-repository-url>
cd <project directory name>

# Install and start backend dependencies
npm install
npm start

# Install frontend dependencies 
cd client
npm install
cd ..

# Run both with one command from the root:
npm start
```

---

## Config

- **JWT issuance** – `POST /api/auth` in `controllers/auth.js` signs a JWT with `config.JWT_SECRET_KEY` (see `SESSION_EXPIRES_IN`). The payload only contains `user.id` so you can safely extend it.
- **Client storage** – Tokens are pushed into Axios’ default headers via `client/src/helpers/setAuthToken.js`. Persist them in `localStorage`/`sessionStorage` from your auth screen and call `setAuthToken(token)` on boot.
- **Protected routes** – `middleware/auth.js` expects the token in the `x-auth-token` header and injects `req.user`. Use the middleware on any route that needs authenticated identity.

## Contributing Guidelines

### Pre-PR Checklist

- [ ] Branch is updated with `main`  
- [ ] No linting errors
- [ ] No stray console logs or unused variables  
- [ ] UI changes tested on desktop and mobile  
- [ ] Added documentation or comments where needed  
- [ ] Any new `.env` variables are documented  

### Pull Request Rules
- Use clear PR titles:
  - `feat: add tournament lobby UI`
- PR description must include:
  - What changed  
  - Why it changed  
  - How to test  
  - Screenshots for UI updates  
- Tag related issues/tasks.

## Confidentiality
This repository is proprietary to **NaoX**.

