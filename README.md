## Honcathon !

Here is my participation to : the November Honcathon! 🧑‍💻

## Description

For this Hackathon i created a telegram bot made to replace in the most easy way sms api in dev and staging. And also be able to register as many as mobile numbers as requierd to make tests.

My goal was that in one single command this bot will reply with a curl POST request that the user can immediately use to send to himself all the sms traffic of his project in staging and dev.

## Quickstart

To test this project you need to run it locally.
Because creating a bot on telegram is long and boring i will send you all my keys that i will destroy some days after the end of hackaton.

### 1 : Make sure you have the dependencies

- npm : 10.8.2
- node : v20.17.0
- ngrok : 3.18.4

### 2 : Env variables

DATABASE_URL=your neon postgres
FPX_ENDPOINT=http://localhost:8788/v1/traces
TELEGRAM_API_SECRET_URL=your telgram api secret url (in this format https://api.telegram.org/bot[credentials])

* To test the project i will send whith the link of the project all the .env file so you'll just have to copy paste.

### 3 : Launch your project

- 1 : Launch local

```
npm run dev 
```

You should have [wrangler:inf] Ready on http://localhost:PORT

- 2 : Link ngrok

```
ngrok http PORT
```

You should see :

Forwarding NGROK_LINK -> http://localhost:PORT

- 3 : Connect telegram to your webhook

Make this request with no body.

```
POST

https://api.telegram.org/bot[credentials]/setWebhook?url=[NGROK_LINK]/telegram/webhook_handler
```

- 4 : Text your bot.

For our example text @FreeStagingSmsBot

/help and let yourself being guided

## Authors

Gavriel Rosendorn