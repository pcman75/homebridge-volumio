const http = require('http');

http.get('http://living.local/api/v1/getstate', (resp) => {
  let data = '';

  // A chunk of data has been recieved.
  resp.on('data', (chunk) => {
    data += chunk;
  });

  // The whole response has been received. Print out the result.
  resp.on('end', () => {
    console.log(JSON.parse(data).title);
  });

}).on("error", (err) => {
  console.log("Error: " + err.message);
});