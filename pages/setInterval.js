onmessage = function (e) {
    let timer = setInterval(() => {
      postMessage(1);
    }, 1000);
  };
