import { useEffect, useState } from "react";
import "./App.css";

function App() {
  // google cloud
  // const URL = "wss://URL.run.app";
  // aws
  const URL = "wss://URL.cs.amazonlightsail.com";
  const [transcriptionByUser, setTranscriptionByUser] = useState({});
  const [ws, setWs] = useState(new WebSocket(URL));
  const pathName = window.location.pathname.replace("/", "");

  useEffect(() => {
    ws.onopen = () => {
      console.log('WebSocket Connected');
    };
    ws.onmessage = (event) => {
      let data = JSON.parse(event.data);
      setTranscriptionByUser(data);
    };

    return () => {
      ws.onclose = () => {
        if (ws.readyState == ws.CLOSED || ws.readyState == ws.CLOSING) {
          setWs(new WebSocket(URL));
        }
      };
    };
  }, [ws.onmessage, ws.onopen, ws.onclose, transcriptionByUser]);

  return (
    <>
      {pathName && pathName !== "" ? (
        <h1>{transcriptionByUser[pathName]}</h1>
      ) : (
        <>
          {Object.entries(transcriptionByUser).map(([name, transcription]) => (
            <h1>
              {name}: {transcription}
            </h1>
          ))}
        </>
      )}
    </>
  );
}

export default App;
