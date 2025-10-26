# 📚 Biblio-Bot

⚠️ **Warning:**  This is an old project that relies on evolving APIs, it’s likely outdated and may not function properly anymore.

**Biblio-Bot** is a Discord bot that manages a library of files stored on **Google Drive**, using *classic Discord commands* (messages starting with a specific prefix).  

It was originally designed for a **Discord homework-help server**, where each channel corresponds to a topic and certain roles (teachers) can publish or review documents.

More details can be found in the [documentation](/documentation.pdf) and examples in the [examples folder](/example/).

---

## ✨ Features

- **Role-based topic permissions**  
  Each topic has its own role. Only teachers assigned to that topic can publish or review documents related to it.  

- **Peer review system**  
  Documents can be reviewed by peers and updated easily.

- **Search-friendly organization**  
  The bot’s search system works best when channels are topic-specific — but it’s flexible enough to work even in mixed-topic servers.  

---

## 🛠️ Installation Instructions

This project functions as both a **Discord bot** and a **Google Drive bot**, so both need to be created before setup.

1. **Create a Discord bot** via the [Discord Developer Portal](https://discord.com/developers/applications).  
2. **Create a Google Cloud project** and enable the Drive API to generate credentials.

Then, create an `/auth` folder containing two JSON files for authentication:

```json
// discord-token.json
{
    "token": "..."
}

// google-private0.json
{
    "client_email": "...",
    "private_key": "..."
}
```

You can fill in the ellipses once both bots are created — Discord and Google will provide the necessary credentials.

Finally, just run `biblio_launch.bat` to start the bot.
