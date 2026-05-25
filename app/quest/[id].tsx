import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { supabase } from "../../lib/supabase";

const ALLOWED_DISTANCE_METERS = 200;

type Quest = {
  id: string;
  title: string;
  description: string | null;
  reward: number | null;
  lat: number | null;
  lng: number | null;
};

function getDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
) {
  const R = 6371000;
  const toRad = (value: number) => (value * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function QuestDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [quest, setQuest] = useState<Quest | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [message, setMessage] = useState("Загрузка задания...");

  const loadQuestAndLocation = async () => {
    if (!id) return;

    const { data: questData, error } = await supabase
      .from("quests")
      .select("id, title, description, reward, lat, lng")
      .eq("id", String(id))
      .single();

    if (error) {
      setMessage(error.message);
      return;
    }

    setQuest(questData as Quest);

    if (!questData.lat || !questData.lng) {
      setMessage("У этого задания пока нет координат");
      return;
    }

    const permission = await Location.requestForegroundPermissionsAsync();

    if (!permission.granted) {
      setMessage("Нужно разрешение на геолокацию");
      return;
    }

    const location = await Location.getCurrentPositionAsync({});

    const meters = getDistanceMeters(
      location.coords.latitude,
      location.coords.longitude,
      questData.lat,
      questData.lng,
    );

    setDistance(Math.round(meters));
    setMessage("");
  };

  useEffect(() => {
    loadQuestAndLocation();
  }, [id]);

  const canComplete = distance !== null && distance <= ALLOWED_DISTANCE_METERS;

  return (
    <View style={{ flex: 1, backgroundColor: "#fff", padding: 20 }}>
      <Pressable onPress={() => router.back()} style={{ marginBottom: 20 }}>
        <Text style={{ color: "#007aff", fontSize: 16 }}>← Назад</Text>
      </Pressable>

      <Text style={{ fontSize: 30, fontWeight: "900", marginBottom: 12 }}>
        {quest?.title || "Задание"}
      </Text>

      <Text style={{ fontSize: 16, color: "#444", marginBottom: 16 }}>
        {quest?.description || "Описание задания"}
      </Text>

      <View
        style={{
          backgroundColor: "#f5f5f5",
          padding: 16,
          borderRadius: 16,
          marginBottom: 16,
        }}
      >
        <Text style={{ fontWeight: "800", fontSize: 18, marginBottom: 6 }}>
          Награда: {quest?.reward || 10} очков
        </Text>

        {distance !== null ? (
          <Text style={{ color: canComplete ? "#1e9b4b" : "#cc3b30" }}>
            Расстояние до задания: {distance} м
          </Text>
        ) : (
          <Text style={{ color: "#666" }}>{message}</Text>
        )}
      </View>

      {distance !== null && !canComplete ? (
        <View
          style={{
            backgroundColor: "#fff4e5",
            padding: 14,
            borderRadius: 14,
            marginBottom: 16,
          }}
        >
          <Text style={{ color: "#8a5a00", fontWeight: "700" }}>
            Подойди ближе к точке, чтобы выполнить задание.
          </Text>
        </View>
      ) : null}

      {canComplete ? (
        <View
          style={{
            backgroundColor: "#eaf7ee",
            padding: 14,
            borderRadius: 14,
            marginBottom: 16,
          }}
        >
          <Text style={{ color: "#1e7a34", fontWeight: "800" }}>
            Ты рядом. Можно выполнять задание.
          </Text>
        </View>
      ) : null}

      <Pressable
        disabled={!canComplete}
        onPress={() =>
          router.push(
            `/quest/complete?id=${encodeURIComponent(
              String(id),
            )}&title=${encodeURIComponent(String(quest?.title || ""))}` as any,
          )
        }
        style={{
          backgroundColor: canComplete ? "#000" : "#bbb",
          padding: 16,
          borderRadius: 14,
        }}
      >
        <Text
          style={{
            color: "#fff",
            textAlign: "center",
            fontWeight: "800",
            fontSize: 16,
          }}
        >
          {canComplete ? "Выполнить задание" : "Слишком далеко"}
        </Text>
      </Pressable>
    </View>
  );
}
