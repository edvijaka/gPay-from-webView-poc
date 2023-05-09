import React, {useEffect, useRef} from 'react';
import {Button, StyleSheet, Text, View} from 'react-native';
import {WebView} from 'react-native-webview';
import {WebViewMessageEvent} from 'react-native-webview';
import {
  confirmPlatformPayPayment,
  isPlatformPaySupported,
  StripeProvider,
} from '@stripe/stripe-react-native';

function App(): JSX.Element {
  const [stripeClientSecret, setStripeClientSecret] = React.useState();
  const [stripePublishableKey, setStripePublishableKey] = React.useState();

  const [isPaymentPending, setPaymentPending] = React.useState<boolean>(false);
  const [gPayAvailable, setGPayAvailable] = React.useState<boolean>(false);

  const webviewRef = useRef(null);

  useEffect(() => {
    isPlatformPaySupported({googlePay: {testEnv: true}}).then(result => {
      setGPayAvailable(result);
    });
  }, [stripeClientSecret]);

  const displayPayButton = !!stripeClientSecret && gPayAvailable;

  const payWithWallet = async () => {
    setPaymentPending(true);
    if (!stripeClientSecret) {
      sendDataToWebView('Client secret is not set');
    } else {
      try {
        const result = await confirmPlatformPayPayment(stripeClientSecret, {
          googlePay: {
            currencyCode: 'eur',
            testEnv: true,
            merchantName: 'Greet',
            merchantCountryCode: 'LT',
          },
        });
        if (result.error) {
          sendDataToWebView({status: 'failed'});
          setPaymentPending(false);
          return;
        }
        sendDataToWebView({status: 'success'});
        setStripeClientSecret(undefined);
        setPaymentPending(false);
      } catch (error) {
        sendDataToWebView({status: 'failed'});
        setPaymentPending(false);
      }
    }
  };

  const sendDataToWebView = (message: object) => {
    if (!webviewRef.current) {
      return;
    }

    const webView = webviewRef.current as WebView;
    webView.postMessage(JSON.stringify(message));
  };

  const onMessage = (data: WebViewMessageEvent) => {
    console.log(data.nativeEvent.data);

    const parsedData = JSON.parse(data.nativeEvent.data);

    const publishableKey = parsedData.stripePublishableKey;
    const clientSecret = parsedData.stripeClientSecret;

    setStripePublishableKey(publishableKey);
    setStripeClientSecret(clientSecret);
  };

  const renderPayButton = () => {
    if (!displayPayButton) {
      return null;
    }

    if (isPaymentPending) {
      return <Button title="Processing payment..." disabled={true} />;
    }

    return <Button title=" NATIVE Google Pay" onPress={payWithWallet} />;
  };

  const uri = '';

  return (
    // stripePublishableKey will already available by the time you will render this component
    <StripeProvider publishableKey={stripePublishableKey}>
      <>
        <View style={styles.topContainer}>
          <Text>MOCK APP</Text>
        </View>
        <WebView
          ref={webviewRef}
          scalesPageToFit={false}
          mixedContentMode="compatibility"
          onMessage={onMessage}
          source={{uri}}
        />
        {renderPayButton()}
      </>
    </StripeProvider>
  );
}

export default App;

const styles = StyleSheet.create({
  topContainer: {
    height: 48,
    backgroundColor: 'cyan',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
