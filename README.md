# subtitler-v2
Transcribes and translates each user of a Discord call in realtime to a public URL endpoint, with support for model adaptation.
Translation/transcription support running through any configurable mix of openai whisper, Google Cloud transcribe/translate, and deepl
<br/>

# System Diagram
![image](https://github.com/user-attachments/assets/22f34fe2-4f18-458d-bbdb-9de56629b482)

# For Setup -
- Provide necessary env variables in deployment
- "auth_key.json" Google Cloud Service key must be present in `./bot`
- Rename images in docker-compose.yml to your AWS/Google Cloud container registery image names to make pushing easier
- Can be built into docker containers locally using `docker-compose up`
- Then login, push, and deploy with the following envirenment variables (AWS Lightsail and Google Cloud run make this very easy)
<br/>

# Envirenment Variables:
- PROJECT_ID (google cloud project id)
- ISLOCAL (for dev)
- DISCORD_TOKEN
- DEEPL_AUTH_KEY
- OPENAI_API_KEY
- MYSQL_HOST
- MYSQL_USER
- MYSQL_PASS
- MYSQL_DB

# Dev
Can make local docker containers by work commenting/uncommenting lines in
'server\src\App.jsx'
'bot\nginx\default.conf'