import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";

type Profile = {
  username: string;
  points: number;
};

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);

  const loadProfile = async () => {
    const { data: sessionData } = await supabase.auth.getSession();

    const user = sessionData.session?.user;

    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("username, points")
      .eq("id", user.id)
      .single();

    if (error) {
      Alert.alert("Ошибка", error.message);
      return;
    }

    setProfile(data);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/auth" as any);
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const firstLetter = profile?.username?.[0]?.toUpperCase() || "U";

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#f6f6f6",
      }}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View
          style={{
            paddingTop: 30,
            paddingHorizontal: 24,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 34,
              fontWeight: "900",
              marginBottom: 24,
            }}
          >
            Профиль
          </Text>

          <View
            style={{
              width: 110,
              height: 110,
              borderRadius: 999,
              backgroundColor: "#000",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 18,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 46,
                fontWeight: "900",
              }}
            >
              {firstLetter}
            </Text>
          </View>

          <Text
            style={{
              fontSize: 30,
              fontWeight: "900",
            }}
          >
            @{profile?.username || "user"}
          </Text>

          <Text
            style={{
              color: "#666",
              fontSize: 18,
              marginTop: 4,
              marginBottom: 30,
            }}
          >
            CityQuest player
          </Text>

          <View
            style={{
              flexDirection: "row",
              gap: 14,
              marginBottom: 30,
            }}
          >
            <View
              style={{
                backgroundColor: "#fff",
                width: 100,
                padding: 20,
                borderRadius: 18,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 32,
                  fontWeight: "900",
                }}
              >
                {profile?.points || 0}
              </Text>

              <Text
                style={{
                  color: "#666",
                  marginTop: 4,
                }}
              >
                Очки
              </Text>
            </View>

            <View
              style={{
                backgroundColor: "#fff",
                width: 100,
                padding: 20,
                borderRadius: 18,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 32,
                  fontWeight: "900",
                }}
              >
                0
              </Text>

              <Text
                style={{
                  color: "#666",
                  marginTop: 4,
                }}
              >
                Фото
              </Text>
            </View>

            <View
              style={{
                backgroundColor: "#fff",
                width: 100,
                padding: 20,
                borderRadius: 18,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 32,
                  fontWeight: "900",
                }}
              >
                0
              </Text>

              <Text
                style={{
                  color: "#666",
                  marginTop: 4,
                }}
              >
                Квесты
              </Text>
            </View>
          </View>

          <Pressable
            onPress={logout}
            style={{
              backgroundColor: "#ff3b30",
              width: "100%",
              padding: 18,
              borderRadius: 18,
              marginBottom: 30,
            }}
          >
            <Text
              style={{
                color: "#fff",
                textAlign: "center",
                fontWeight: "800",
                fontSize: 18,
              }}
            >
              Выйти
            </Text>
          </Pressable>

          <View
            style={{
              width: "100%",
            }}
          >
            <Text
              style={{
                fontSize: 28,
                fontWeight: "900",
                marginBottom: 10,
              }}
            >
              Мои фото
            </Text>

            <Text
              style={{
                color: "#666",
                fontSize: 16,
              }}
            >
              Пока нет загруженных фото
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
