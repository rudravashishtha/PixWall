import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import React, { useState } from "react";
import { BlurView } from "expo-blur";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { theme } from "../../constants/theme";
import { hp, wp } from "../../helpers/common";
import { Entypo, Octicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import Toast from "react-native-toast-message";
import { Clipboard } from "react-native-web";

const ImageScreen = () => {
  const router = useRouter();
  const item = useLocalSearchParams();
  const [status, setStatus] = useState("loading");

  let uri = item?.webformatURL;
  const fileName = item?.previewURL.split("/").pop();
  const imageUrl = uri;
  const filePath = `${FileSystem.documentDirectory}${fileName}`;

  const getSize = () => {
    const aspectRatio = item?.imageWidth / item?.imageHeight;
    const maxWidth = Platform.OS == "web" ? wp(30) : wp(92);

    let calculatedHeight = maxWidth / aspectRatio;
    let calculatedWidth = maxWidth;

    if (aspectRatio < 1) {
      // Portrait
      calculatedWidth = calculatedHeight * aspectRatio;
    }
    return {
      width: calculatedWidth,
      height: calculatedHeight,
    };
  };

  const onLoad = () => {
    setStatus("");
  };

  const handleDownloadImage = async () => {
    if (Platform.OS === "web") {
      const anchor = document.createElement("a");
      anchor.href = imageUrl;
      anchor.target = "_blank";
      anchor.download = fileName || "download";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } else {
      setStatus("downloading");
      let uri = await downloadFile();
      if (uri) {
        showToast("Image downloaded successfully");
      }
    }
  };

  const copyToClipboard = (imageUrl) => {
    Clipboard.setString(`${imageUrl}`);
  };

  const handleShareImage = async () => {
    if (Platform.OS == "web") {
      copyToClipboard(item?.webformatURL);
      showToast("Link Copied to Clipboard");
    } else {
      setStatus("sharing");
      let uri = await downloadFile();
      if (uri) {
        await Sharing.shareAsync(uri);
      }
    }
  };

  const downloadFile = async () => {
    try {
      const { uri } = await FileSystem.downloadAsync(imageUrl, filePath);
      setStatus("");
      //   console.log("Finished downloading to ", uri);
      return uri;
    } catch (err) {
      console.log("Error downloading file: ", err.message);
      setStatus("");
      Alert.alert("Image", err.message);
      return null;
    }
  };

  const showToast = (message) => {
    Toast.show({
      type: "success",
      text1: message,
      position: "bottom",
    });
  };

  const toastConfig = {
    success: ({ text1, props, ...rest }) => (
      <View style={styles.toast}>
        <Text style={styles.toastText}>{text1}</Text>
      </View>
    ),
  };

  return (
    <BlurView
      tint="dark"
      intensity={50}
      //   experimentalBlurMethod="dimezisBlurView"
      style={styles.container}
    >
      <View style={getSize()}>
        {/* User name */}
        {/* <View style={{ marginTop: 20 }}>
          <Image
            source={item?.userImageURL}
            style={{ width: 40, height: 40 }}
          />
          <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>
            {item?.user}
          </Text>
        </View> */}
        <View style={styles.loading}>
          {status == "loading" && (
            <ActivityIndicator size="large" color="white" />
          )}
        </View>
        <Image
          source={uri}
          style={[styles.image, getSize()]}
          transition={100}
          onLoad={onLoad}
        />
      </View>

      <View style={styles.buttons}>
        {/* Close Button */}
        <Animated.View entering={FadeInDown.springify().delay(100)}>
          <Pressable onPress={() => router.back()} style={styles.button}>
            <Octicons name="x" size={24} color="white" />
          </Pressable>
        </Animated.View>

        {/* Download Button */}
        <Animated.View entering={FadeInDown.springify().delay(200)}>
          {status == "downloading" ? (
            <View style={styles.button}>
              <ActivityIndicator size="small" color="white" />
            </View>
          ) : (
            <Pressable onPress={handleDownloadImage} style={styles.button}>
              <Octicons name="download" size={24} color="white" />
            </Pressable>
          )}
        </Animated.View>

        {/* Share Button */}
        <Animated.View entering={FadeInDown.springify().delay(300)}>
          {status == "sharing" ? (
            <View style={styles.button}>
              <ActivityIndicator size="small" color="white" />
            </View>
          ) : (
            <Pressable onPress={handleShareImage} style={styles.button}>
              <Entypo name="share" size={22} color="white" />
            </Pressable>
          )}
        </Animated.View>
      </View>
      <Toast config={toastConfig} visibilityTime={2500} />
    </BlurView>
  );
};

export default ImageScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: wp(4),
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  image: {
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  loading: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  buttons: {
    marginTop: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 50,
  },
  button: {
    height: hp(6),
    width: hp(6),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255 ,0.2)",
    borderRadius: theme.radius.lg,
    borderCurve: "continuous",
  },
  toast: {
    padding: 15,
    paddingHorizontal: 30,
    borderRadius: theme.radius.xl,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  toastText: {
    fontSize: hp(1.8),
    fontWeight: theme.fontWeights.semibold,
    color: "white",
  },
});
