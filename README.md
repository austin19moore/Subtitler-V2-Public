# Subtitler-V2
Transcribes and translates each user of a Discord call in realtime to a public URL endpoint, with support for model adaptation.
<br/>

Built using:
- Node.js
- [Discord.js](https://discord.js.org/)
- Docker
- Google Cloud Translate and Speech to Text
- CI/CD Pipeline deployed using Google Cloud Build/Run
- AWS ECR, Lightsail/ECS for cheaper alternative
- NGINX
- Websockets to deliver realtime content updates from container to container

# For Setup -
- Replace necessary variables in `./bot/utils.js`, specifically project id and source/target language
- "auth_key.json" Google Cloud key must be present in `./bot`
- Rename images in docker-compose.yml to your AWS/Google Cloud container registery image names to make pushing easier
- Can be built into docker containers locally using
`docker-compose up`
- Then login, push, and deploy with the following envirenment variables (AWS Lightsail and Google Cloud run make this very easy)

<br/>
The server image will need a public URL endpoint accessible through whatever platform you are using, which will be where translations are displayed
<br/>

# ENVIRENMENT VARIABLES:
For Bot image:
- DISCORD_TOKEN : Discord bot token
- MYSQL_HOST : database host port
- MYSQL_USER : database user
- MYSQL_PASS : database user password
- MYSQL_DB : database name
- SERVER_URL : Your public server image URL

# CI/CD Pipeline using Google Cloud
Can be setup by pushing to a private Github repository, then linking inside of Google Cloud Build to auto-trigger a build on merge to the main branch, and automating deployment on Google Cloud run on build success.
