import * as ed from "@noble/ed25519";
import React, { useState } from "react";
import {
  Button,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
// import "react-native-get-random-values";
import { sha512 } from "@noble/hashes/sha2";
import { base64 } from "@scure/base";
import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import { sha256 } from "js-sha256";
import { Sheet } from "react-modal-sheet";
ed.etc.sha512Sync = (...m) => sha512(ed.etc.concatBytes(...m));

const App = () => {
  const [activeTab, setActiveTab] = useState("sign");
  const [message, setMessage] = useState("");
  const [hash, setHash] = useState("");
  const [signature, setSignature] = useState("");
  const [pubKey, setPubKey] = useState("");
  const [profileVisible, setProfileVisible] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState("");
  const [verifyPublicKey, setVerifyPublicKey] = useState("");
  const [verifySignature, setVerifySignature] = useState("");
  const [verificationResult, setVerificationResult] = useState<
    undefined | boolean
  >();
  // 生成密钥对
  const generateKeyPair = async () => {
    const privateKey = ed.utils.randomPrivateKey();
    const publicKey = await ed.getPublicKeyAsync(privateKey);
    return { privateKey, publicKey };
  };

  // 哈希并签名
  const hashAndSign = async () => {
    if (!message) return;

    const keyPair = await generateKeyPair();
    const privKey = keyPair.privateKey;
    const pubKey = keyPair.publicKey;
    setPubKey(base64.encode(pubKey));
    // 按需求文档，计算SHA-256哈希
    const messageBytes = new TextEncoder().encode(message);
    const hashBytes = sha256(messageBytes);
    setHash(hashBytes);

    // 使用Ed25519签名, 该方法只支持sha512
    const sig = ed.sign(sha512(messageBytes), privKey);
    setSignature(base64.encode(sig));
  };

  // 验证签名
  const verify = async () => {
    if (!verifyMessage || !verifyPublicKey || !verifySignature) return;

    try {
      // 计算消息哈希
      const messageBytes = new TextEncoder().encode(verifyMessage);
      const hashBytes = await ed.etc.sha512Async(messageBytes);

      // 验证签名
      const pubKeyBytes = base64.decode(verifyPublicKey);
      const sigBytes = base64.decode(verifySignature);
      const isValid = ed.verify(sigBytes, hashBytes, pubKeyBytes);

      setVerificationResult(isValid);
    } catch (error) {
      console.error("验证失败:", error);
      setVerificationResult(false);
    }
  };
  return (
    <View style={styles.container}>
      <Button
        title="个人资料"
        onPress={() => {
          setProfileVisible(true);
        }}
      ></Button>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "sign" && styles.activeTab]}
          onPress={() => setActiveTab("sign")}
        >
          <Text style={styles.tabText}>签名</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "verify" && styles.activeTab]}
          onPress={() => setActiveTab("verify")}
        >
          <Text style={styles.tabText}>验证</Text>
        </TouchableOpacity>
      </View>

      {activeTab === "sign" ? (
        <ScrollView style={styles.content}>
          <Text style={styles.label}>消息:</Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={4}
            value={message}
            onChangeText={setMessage}
            placeholder="输入要签名的消息"
          />
          <Button title="Hash + Sign" onPress={hashAndSign} />

          {hash ? (
            <>
              <Text style={styles.label}>SHA-256 哈希 (Hex):</Text>
              <Text
                style={styles.mono}
                onPress={async () => {
                  await Clipboard.setStringAsync(hash);
                  alert("已复制");
                }}
              >
                {hash}
              </Text>
            </>
          ) : null}

          {pubKey ? (
            <>
              <Text style={styles.label}>公钥 (Base64) 点击复制:</Text>
              <Text
                style={styles.mono}
                onPress={async () => {
                  await Clipboard.setStringAsync(pubKey);
                  alert("已复制");
                }}
              >
                {pubKey}
              </Text>
            </>
          ) : null}

          {signature ? (
            <>
              <Text style={styles.label}>签名 (Base64) 点击复制:</Text>
              <Pressable
                onPress={async () => {
                  await Clipboard.setStringAsync(signature);
                  alert("已复制");
                }}
              >
                <Text style={styles.mono}>{signature}</Text>
              </Pressable>
            </>
          ) : null}
        </ScrollView>
      ) : (
        <ScrollView style={styles.content}>
          <Text style={styles.label}>消息:</Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={4}
            value={verifyMessage}
            onChangeText={setVerifyMessage}
            placeholder="输入要验证的消息"
          />

          <Text style={styles.label}>公钥 (Base64):</Text>
          <TextInput
            style={styles.input}
            value={verifyPublicKey}
            onChangeText={setVerifyPublicKey}
            placeholder="输入公钥"
          />

          <Text style={styles.label}>签名 (Base64):</Text>
          <TextInput
            style={styles.input}
            value={verifySignature}
            onChangeText={setVerifySignature}
            placeholder="输入签名"
          />

          <Button title="Verify" onPress={verify} />

          {verificationResult !== undefined && (
            <View
              style={[
                styles.resultBox,
                verificationResult ? styles.valid : styles.invalid,
              ]}
            >
              <Text style={styles.resultText}>
                {verificationResult ? "有效签名" : "无效签名"}
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      <Sheet isOpen={profileVisible} onClose={() => setProfileVisible(false)}>
        <Sheet.Container>
          <Sheet.Header>
            <ImageBackground
              source={require("../../assets/images/profile/background.png")}
              resizeMode="cover"
              style={styles.headerWrap}
              imageStyle={{
                borderTopLeftRadius: 8,
                borderTopRightRadius: 8,
                width: "100%",
              }}
            >
              {/* header btn */}
              <View
                style={{
                  flexDirection: "row",
                  paddingHorizontal: 19,
                  paddingVertical: 22,
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Image
                  style={{ width: 18, height: 12 }}
                  source={require("../../assets/images/profile/menu.png")}
                  contentFit="cover"
                />
                <Image
                  style={{ width: 63, height: 20 }}
                  source={require("../../assets/images/profile/logo.png")}
                  contentFit="cover"
                />
                <Image
                  style={{ width: 18, height: 12 }}
                  source={require("../../assets/images/profile/menu.png")}
                  contentFit="cover"
                />
              </View>
              {/* fund icon */}
              <Image
                style={{
                  width: 161,
                  height: 153,
                  position: "absolute",
                  top: 66,
                  right: 20,
                }}
                source={require("../../assets/images/profile/fund.png")}
                contentFit="cover"
              />
              {/* header content */}
              <View
                style={{
                  paddingHorizontal: 20,
                  paddingBottom: 20,
                  zIndex: 2,
                }}
              >
                <Image
                  style={{
                    width: 122,
                    height: 32,
                    position: "absolute",
                    top: 0,
                    right: 22,
                  }}
                  source={require("../../assets/images/profile/daily-check-In.png")}
                  contentFit="cover"
                />
                {/* header main text */}
                <Image
                  style={{
                    width: 326,
                    height: 124,
                  }}
                  source={require("../../assets/images/profile/header-text.png")}
                  contentFit="cover"
                />
                {/* header hint */}
                <Image
                  style={{
                    width: 353,
                    height: 48,
                    marginTop: 20,
                  }}
                  source={require("../../assets/images/profile/header-hint.png")}
                  contentFit="cover"
                />
              </View>
            </ImageBackground>
          </Sheet.Header>
          <Sheet.Content>
            <Sheet.Scroller>
              <View style={{ padding: 20, backgroundColor: "#F7F6F1" }}>
                <Image
                  style={{
                    width: 353,
                    height: 284,
                  }}
                  source={require("../../assets/images/profile/featured-products.png")}
                  contentFit="cover"
                />
                <Image
                  style={{
                    width: 353,
                    height: 110,
                    marginTop: 24,
                  }}
                  source={require("../../assets/images/profile/coming-soon.png")}
                  contentFit="cover"
                />
                <Image
                  style={{
                    width: 353,
                    height: 110,
                    marginTop: 24,
                  }}
                  source={require("../../assets/images/profile/coming-soon.png")}
                  contentFit="cover"
                />
                <Image
                  style={{
                    width: 353,
                    height: 110,
                    marginTop: 24,
                  }}
                  source={require("../../assets/images/profile/coming-soon.png")}
                  contentFit="cover"
                />
              </View>
            </Sheet.Scroller>
          </Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop />
      </Sheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    padding: 15,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#ddd",
  },
  activeTab: {
    borderBottomColor: "#007AFF",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
  },
  label: {
    marginTop: 10,
    marginBottom: 5,
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: 10,
    marginBottom: 10,
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: 10,
    marginBottom: 10,
    height: 100,
    textAlignVertical: "top",
  },
  mono: {
    fontFamily: "monospace",
    backgroundColor: "#f5f5f5",
    padding: 10,
    borderRadius: 4,
    marginBottom: 10,
  },
  resultBox: {
    padding: 15,
    borderRadius: 4,
    marginTop: 20,
    alignItems: "center",
  },
  valid: {
    backgroundColor: "#d4edda",
  },
  invalid: {
    backgroundColor: "#f8d7da",
  },
  resultText: {
    fontWeight: "bold",
    color: "#155724",
  },
  headerWrap: {
    height: 272,
  },
  contentContainer: {
    flex: 1,
    alignItems: "center",
  },
});

export default App;
