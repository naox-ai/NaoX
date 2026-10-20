# NaoX

## Quantum-Resistant Blockchain and Decentralized Infrastructure for AI

> **NaoX** is a next-generation, EVM-compatible Layer 1 blockchain built with **post-quantum cryptography** to help secure digital assets, decentralized applications, and connected infrastructure against future quantum-computing threats. **NaoX** provides a foundation for secure smart contracts, distributed validation, and the next generation of decentralized applications, including AI-powered systems and agents.

---

## Current Features

- **Post-Quantum Cryptography**: 
- **EVM Compatibility**: Support for Ethereum-compatible smart contracts and familiar development workflows, enabling developers to build and deploy decentralized applications.
- **Decentralized Infrastructure for AI**: A foundation for developing secure, decentralized AI-powered applications, services, and agents.
- **Quantum-Resistant Layer 1 Blockchain**: A dedicated blockchain infrastructure designed to provide a more resilient foundation for decentralized applications and digital assets.
- **Multi-Chain Support**: Play on **Ethereum (EVM)**, **Solana**, and other supported blockchains. Your assets and rewards can move between chains.
- **Smart Contract Support**: On-chain application logic and programmable functionality for building decentralized services and blockchain-based solutions.
- **Distributed Network Validation**: A decentralized infrastructure model designed to support network participation, transaction verification, and resilience.
- **Digital Asset Security**: : Post-quantum security capabilities designed to strengthen the protection of blockchain transactions and digital assets.

---

## Coming Soon

- **AI-Powered Decentralized Applications**: Expand the ecosystem with applications and services that combine decentralized infrastructure with AI capabilities.
- **Secure AI Agents:**: Support the development of AI agents that interact with blockchain networks, smart contracts, and decentralized services.
- **Developer Tools and SDKs**: Enhance the developer experience with documentation, libraries, and integration tools for building on NaoX, as they become available.
- **Expanded Infrastructure Integrations**: Broaden integrations across decentralized applications, connected devices, and distributed infrastructure.
- **Ecosystem Expansion**: Enable more developers, infrastructure providers, and application builders to participate in the NaoX ecosystem.


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
cd frontend
npm install

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

