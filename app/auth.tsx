import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    if (!username || !email || !password) {
      Alert.alert("Ошибка", "Заполни все поля");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      Alert.alert("Ошибка", error.message);
      return;
    }

    if (data.user) {
      await supabase.from("profiles").insert({
        id: data.user.id,
        username,
        points: 0,
      });

      Alert.alert(
        "Почта отправлена",
        "Подтверди email и потом войди в аккаунт",
      );

      setIsLogin(true);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Ошибка", "Заполни поля");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Alert.alert("Ошибка", error.message);
      return;
    }

    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#f6f6f6",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <View style={{ marginBottom: 40 }}>
        <Text
          style={{
            fontSize: 46,
            fontWeight: "900",
            color: "#000",
            marginBottom: 8,
          }}
        >
          CityQuest
        </Text>

        <Text
          style={{
            fontSize: 20,
            color: "#666",
          }}
        >
          Войди или создай аккаунт
        </Text>
      </View>

      {!isLogin && (
        <TextInput
          placeholder="Username"
          placeholderTextColor="#999"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          style={{
            backgroundColor: "#fff",
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 16,
            padding: 18,
            marginBottom: 14,
            fontSize: 16,
            color: "#000",
          }}
        />
      )}

      <TextInput
        placeholder="Email"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{
          backgroundColor: "#fff",
          borderWidth: 1,
          borderColor: "#ddd",
          borderRadius: 16,
          padding: 18,
          marginBottom: 14,
          fontSize: 16,
          color: "#000",
        }}
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#999"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{
          backgroundColor: "#fff",
          borderWidth: 1,
          borderColor: "#ddd",
          borderRadius: 16,
          padding: 18,
          marginBottom: 20,
          fontSize: 16,
          color: "#000",
        }}
      />

      <Pressable
        onPress={isLogin ? handleLogin : handleRegister}
        style={{
          backgroundColor: "#000",
          padding: 18,
          borderRadius: 18,
          marginBottom: 20,
        }}
      >
        <Text
          style={{
            color: "#fff",
            textAlign: "center",
            fontSize: 18,
            fontWeight: "700",
          }}
        >
          {isLogin ? "Войти" : "Создать аккаунт"}
        </Text>
      </Pressable>

      <Pressable onPress={() => setIsLogin(!isLogin)}>
        <Text
          style={{
            color: "#007aff",
            textAlign: "center",
            fontSize: 18,
          }}
        >
          {isLogin
            ? "Нет аккаунта? Зарегистрироваться"
            : "Уже есть аккаунт? Войти"}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}
