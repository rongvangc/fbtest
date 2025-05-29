import { StatusBar } from "expo-status-bar";
import { requestTrackingPermissionsAsync } from "expo-tracking-transparency";
import { useEffect } from "react";
import { Alert, Button, StyleSheet, View } from "react-native";
import {
  AccessToken,
  GraphRequest,
  GraphRequestManager,
  LoginButton,
  LoginManager,
  Settings,
  ShareContent,
  ShareDialog,
} from "react-native-fbsdk-next";

export default function App() {
  useEffect(() => {
    const initFacebookSDK = async () => {
      try {
        const { status } = await requestTrackingPermissionsAsync();

        // Chỉ khởi tạo SDK một lần
        Settings.initializeSDK();

        if (status === "granted") {
          await Settings.setAdvertiserTrackingEnabled(true);
          Settings.setAdvertiserIDCollectionEnabled(true);
          Settings.setAutoLogAppEventsEnabled(true);
        }
      } catch (error) {
        console.error("Init error:", error);
      }
    };

    initFacebookSDK();
  }, []);

  const getData = async () => {
    try {
      const currentToken = await AccessToken.getCurrentAccessToken();
      if (!currentToken) {
        Alert.alert("Error", "Please login first");
        return;
      }

      const infoRequest = new GraphRequest(
        "/me",
        {
          parameters: {
            fields: {
              string: "id,name,email", // Lấy thêm email nếu cần
            },
          },
        },
        (error, result) => {
          if (error) {
            console.log("Graph API Error:", error);
            Alert.alert("Error", "Failed to get user data");
          } else {
            console.log("User Data:", result);
            Alert.alert("Success", `Hello ${result?.name}!`);
          }
        }
      );
      new GraphRequestManager().addRequest(infoRequest).start();
    } catch (error) {
      console.error("Get data error:", error);
    }
  };

  const shareLink = async () => {
    try {
      const content: ShareContent = {
        contentType: "link",
        contentUrl: "https://facebook.com",
      };

      const canShow = await ShareDialog.canShow(content);

      if (canShow) {
        const result = await ShareDialog.show(content);
        if (result.isCancelled) {
          console.log("Share cancelled");
        } else {
          console.log("Share success", result.postId);
        }
      }
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  const loginWithFacebook = async () => {
    try {
      const result = await LoginManager.logInWithPermissions([
        "public_profile",
        "email",
      ]);

      if (result.isCancelled) {
        console.log("Login cancelled");
      } else {
        const tokenData = await AccessToken.getCurrentAccessToken();
        console.log("Login success, token:", tokenData);
        Alert.alert("Success", "Logged in successfully!");
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Error", "Login failed. Please try again.");
    }
  };

  const logout = async () => {
    try {
      // 1. Logout từ cả 2 nguồn
      await LoginManager.logOut();

      // 2. Đợi 1 chút để hệ thống xử lý
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 3. Kiểm tra kỹ hơn
      const token = await AccessToken.getCurrentAccessToken();
      console.log("Token after logout:", token);

      if (!token || !token.accessToken) {
        Alert.alert("Success", "Logged out!");
      } else {
        Alert.alert("Error", "Still logged in!");
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Sử dụng cả LoginButton và custom button để test */}
      <LoginButton
        onLoginFinished={async (error, result) => {
          if (error) {
            console.log("Login error:", error);
            Alert.alert("Error", error.message);
          } else if (result.isCancelled) {
            console.log("Login cancelled");
            Alert.alert("Info", "Login cancelled");
          } else {
            try {
              const token = await AccessToken.getCurrentAccessToken();
              console.log("Login success:", token);
              Alert.alert("Success", "Logged in!");
            } catch (e) {
              console.error("Token check error:", e);
            }
          }
        }}
        onLogoutFinished={() => {
          console.log("Logged out from button");
          Alert.alert("Info", "Logged out from button");
        }}
      />
      <Button title="Login with Facebook" onPress={loginWithFacebook} />
      <Button
        title="Get User Data"
        onPress={getData} // Đã sửa thành getData
      />
      <Button title="Share Link" onPress={shareLink} />
      <Button title="Logout" onPress={logout} />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    gap: 10, // Thêm khoảng cách giữa các nút
  },
});
