export default {
  janode: {
    address: [{
      url: 'ws://192.168.50.116:8188/', // 리눅스 ip주소
      // url: 'ws://janus.wizbase.co.kr:8188/',
      apisecret: 'secret'
    }],
    // seconds between retries after a connection setup error
    retry_time_secs: 10
  },
  web: {
    port: 4443,
    bind: '0.0.0.0',
    key: 'C:/Users/YMX/server.key',
    cert: 'C:/Users/YMX/server.crt'
  }
};
