import React, {useEffect, useRef} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {WebView} from 'react-native-webview';
import {WebViewMessageEvent} from 'react-native-webview';
import {
  confirmPlatformPayPayment,
  isPlatformPaySupported,
  StripeProvider,
} from '@stripe/stripe-react-native';

type WalletProps = {
  googlePay?: {
    testEnv: boolean;
    merchantCountryCode: string;
    currencyCode: string;
  };
};

function App(): JSX.Element {
  const [stripeClientSecret, setStripeClientSecret] = React.useState();
  const [stripePublishableKey, setStripePublishableKey] = React.useState();
  const [walletProps, setWalletProps] = React.useState<WalletProps>({});

  const [gPayAvailable, setGPayAvailable] = React.useState<boolean>(false);

  const webviewRef = useRef(null);

  useEffect(() => {
    if (stripePublishableKey) {
      isPlatformPaySupported({googlePay: {testEnv: true}}).then(result => {
        if (result) {
          setGPayAvailable(result);

          // Send to webview that google pay is available
          sendDataToWebView({externalWallets: ['googlePay']});
        }
      });
    }
  }, [stripePublishableKey]);

  const payWithWallet = async (clientSecret?: string) => {
    if (!clientSecret) {
      sendDataToWebView('Client secret is not set');
    } else {
      try {
        const result = await confirmPlatformPayPayment(clientSecret, {
          googlePay: walletProps.googlePay,
        });
        if (result.error) {
          sendDataToWebView({paymentStatus: 'failed'});
          return;
        }
        sendDataToWebView({paymentStatus: 'success'});
        setStripeClientSecret(undefined);
      } catch (error) {
        sendDataToWebView({paymentStatus: 'failed'});
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

    // Will be available on first load
    const publishableKey = parsedData.stripePublishableKey;
    if (publishableKey) {
      setStripePublishableKey(publishableKey);
    }

    const walletPropsFromGreet = parsedData.walletProps;

    if (walletPropsFromGreet) {
      setWalletProps(walletPropsFromGreet);
    }

    // On pay button click in webview
    const clientSecret = parsedData.stripeClientSecret;
    if (clientSecret && gPayAvailable) {
      setStripeClientSecret(clientSecret);
      payWithWallet(clientSecret);
    }
  };

  const uri = '';

  return (
    // stripePublishableKey will already available by the time you will render this component
    <StripeProvider publishableKey={stripePublishableKey}>
      <>
        <View style={styles.topContainer}>
          <Text>MOCK APP</Text>
          <View>
            <Text>stripeClientSecret: {stripeClientSecret}</Text>
          </View>
          <View>
            <Text>stripePublishableKey: {stripePublishableKey}</Text>
          </View>
        </View>
        <WebView
          ref={webviewRef}
          scalesPageToFit={false}
          mixedContentMode="compatibility"
          onMessage={onMessage}
          source={{uri}}
        />
      </>
    </StripeProvider>
  );
}

export default App;

const styles = StyleSheet.create({
  topContainer: {
    height: 150,
    backgroundColor: 'cyan',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
