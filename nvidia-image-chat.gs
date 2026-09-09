import axios from 'axios';


const invokeUrl = "https://integrate.api.nvidia.com/v1/chat/completions";
const stream = false;

const headers = {
  "Authorization": "Bearer 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",
  "Accept": stream ? "text/event-stream" : "application/json"
};

async function main() {
  const payload = {"messages":[{"role":"user","content":[{"type":"text","text":"What is in this image?"},{"type":"image_url","image_url":{"url":"https://assets.ngc.nvidia.com/products/api-catalog/phi-3-5-vision/example1b.jpg"}}]},"model":"google/gemma-4-31b-it","chat_template_kwargs":{"enable_thinking":true},"max_tokens":16384,"stream":stream,"temperature":1,"top_p":0.95};

  const response = await axios.post(invokeUrl, payload, {
    headers: headers,
    responseType: stream ? 'stream' : 'json'
  });

  if (stream) {
    response.data.on('data', (chunk) => {
      console.log(chunk.toString());
    });
  } else {
    console.log(JSON.stringify(response.data));
  }
}

main().catch(error => {
  if (error.response) {
    console.error(`HTTP ${error.response.status}`);
    if (error.response.data?.on) {
      error.response.data.on('data', (chunk) => console.error(chunk.toString()));
    } else {
      console.error(error.response.data);
    }
  } else {
    console.error(error);
  }
});
