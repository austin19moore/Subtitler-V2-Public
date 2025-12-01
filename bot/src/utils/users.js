var Users = (function () {
  var instance;
  function users() {
    if (instance) {
      return instance;
    };
    instance = this;
    instance.users = {};
    instance.createUser = (id, username, targetLang, sourceLang) => {
        if (instance.findUser(id)) {
            return instance.users[id];
        }
        instance.users[id] = {};
        instance.users[id].id = id;
        instance.users[id].username = username;
        instance.users[id].targetLang = targetLang ?? "en-US";
        instance.users[id].sourceLang = sourceLang ?? "ja-JP";
        instance.users[id].transcriptionOnly = false;
        instance.users[id].translationModel = "Default";
        instance.users[id].context = []; // array of previous transcriptions for context
        return instance.users[id];
    };
    instance.findUser = (id) => {
        return instance.users[id];
    };
    instance.findUserByUsername = (username) => {
      return instance.users[username];
    };
    instance.getUsers = () => {
        return instance.users;
    };
    instance.getSourceLangByUser = (id) => {
        return instance.users[id]?.sourceLang;
    };
    instance.getTargetLangByUser = (id) => {
        return instance.users[id]?.targetLang;
    };
    instance.getTranscriptionOnlyByUser = (id) => {
        return instance.users[id]?.transcriptionOnly;
    };
    instance.setTargetLangByUser = (id, targetLang) => {
        if (instance.findUser(id)) {
            instance.users[id].targetLang = targetLang;
        }
    };
    instance.setSourceLangByUser = (id, sourceLang) => {
        if (instance.findUser(id)) {
            instance.users[id].sourceLang = sourceLang;
        }
    };
    instance.setTranscriptionOnlyByUser = (id, ifTrue) => {
        if (instance.findUser(id)) {
            instance.users[id].transcriptionOnly = ifTrue;
        }
    };
    instance.setUsers = (newUsers) => {
        newUsers.forEach(user => {
            instance.createUser(user.id, user.username, user.targetLang, user.sourceLang);
        });
    };
    instance.addContextByUser = (id, context, max) => {
        if (instance.findUser(id)) {
          if (instance.users[id].context.length >= max) {
            instance.users[id].context.shift();
          }
            instance.users[id].context.push(context);
        }
    };
  }
  users.getInstance = function () {
    return instance || new users();
  };
  return users;
})();

module.exports = { Users };