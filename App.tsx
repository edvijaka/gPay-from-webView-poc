import React, {useEffect, useRef} from 'react';
import {Button} from 'react-native';
import {WebView} from 'react-native-webview';
import {WebViewMessageEvent} from 'react-native-webview';
import {
  confirmPlatformPayPayment,
  isPlatformPaySupported,
  StripeProvider,
} from '@stripe/stripe-react-native';

function App(): JSX.Element {
  const [clientSecret, setClientSecret] = React.useState<string | null>(null);
  const [isPaymentPending, setPaymentPending] = React.useState<boolean>(false);
  const [gPayAvailable, setGPayAvailable] = React.useState<boolean>(false);

  const webviewRef = useRef(null);

  useEffect(() => {
    isPlatformPaySupported({googlePay: {testEnv: true}}).then(result => {
      setGPayAvailable(result);
    });
  }, [clientSecret]);

  const displayPayButton = !!clientSecret && gPayAvailable;

  const tmp = async () => {
    setPaymentPending(true);
    if (!clientSecret) {
      sendDataToWebView('Client secret is not set');
    } else {
      try {
        const result = await confirmPlatformPayPayment(clientSecret, {
          googlePay: {
            currencyCode: 'eur',
            testEnv: true,
            merchantName: 'Greet',
            merchantCountryCode: 'LT',
          },
        });
        if (result.error) {
          sendDataToWebView('Payment failed');
          setPaymentPending(false);
          return;
        }
        sendDataToWebView('Payment successful');
        setPaymentPending(false);
      } catch (error) {
        sendDataToWebView('Payment failed');
        setPaymentPending(false);
      }
    }
  };

  const sendDataToWebView = (message: string) => {
    if (!webviewRef.current) {
      return;
    }

    const webView = webviewRef.current as WebView;
    webView.postMessage(message);
  };

  const onMessage = (data: WebViewMessageEvent) => {
    console.log(data.nativeEvent.data);
    setClientSecret(data.nativeEvent.data);
  };

  const renderPayButton = () => {
    if (!displayPayButton) {
      return null;
    }

    if (isPaymentPending) {
      return <Button title="Processing payment..." disabled={true} />;
    }

    return <Button title=" NATIVE Google Pay" onPress={tmp} />;
  };

  const stripePublishableKey = 'pk_test';
  const stripeClientSecret = 'pi_';

  return (
    <StripeProvider publishableKey={stripePublishableKey}>
      <>
        <WebView
          ref={webviewRef}
          scalesPageToFit={false}
          mixedContentMode="compatibility"
          onMessage={onMessage}
          source={{
            html: ` 
          <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
          </head>
          <body
            style="
              display: flex;
              justify-content: center;
              flex-direction: column;
              align-items: center;
            "
          >
            <button
            onclick="sendDataToReactNativeApp()"
              style="
                padding: 20;
                width: 200;
                font-size: 20;
                color: white;
                background-color: #6751ff;
              "
            >
              Initiate payment from WebView
            </button>
            <p id="test">Nothing received yet</p>
            <script>
              const sendDataToReactNativeApp = async () => {
                window.ReactNativeWebView.postMessage('${stripeClientSecret}');
              };
              window.addEventListener('message',function(event){
                document.getElementById('test').innerHTML = event.data;
                console.log("Message received from RN: ",event.data);
              },false);
              document.addEventListener('message',function(event){
                document.getElementById('test').innerHTML = event.data;
                console.log("Message received from RN: ",event.data);
              },false);
            </script>
          </body>
        </html>`,
          }}
        />
        {renderPayButton()}
      </>
    </StripeProvider>
  );
}

export default App;
