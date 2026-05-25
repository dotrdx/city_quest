import * as Location from "expo-location";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, Text, View } from "react-native";
import { supabase } from "../../lib/supabase";

type Quest = {
  id: string;
  title: string;
  description: string | null;
  reward: number | null;
  lat: number | null;
  lng: number | null;
};

type UserLocation = {
  latitude: number;
  longitude: number;
};

export default function MapScreen() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [message, setMessage] = useState("???????? ?????...");

  const loadQuests = async () => {
    const { data, error } = await supabase
      .from("quests")
      .select("id, title, description, reward, lat, lng");

    if (error) {
      setMessage(error.message);
      return;
    }

    setQuests((data as Quest[]) || []);
  };

  const loadLocation = async () => {
    const permission = await Location.requestForegroundPermissionsAsync();

    if (!permission.granted) {
      setMessage("????? ?????????? ?? ??????????");
      return;
    }

    const location = await Location.getCurrentPositionAsync({});

    setUserLocation({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });

    setMessage("");
  };

  useEffect(() => {
    loadQuests();
    loadLocation();
  }, []);

  if (Platform.OS === "web") {
    return (
      <View
        style={{
          flex: 1,
          padding: 24,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fff",
        }}
      >
        <Text style={{ fontSize: 22, fontWeight: "800", marginBottom: 10 }}>
          ????? ???????? ?? ????????
        </Text>
        <Text style={{ color: "#666", textAlign: "center" }}>
          ?????? ?????????? ????? Expo Go ?? Android ??? iPhone.
        </Text>
      </View>
    );
  }

  const MapView = require("react-native-maps").default;
  const Marker = require("react-native-maps").Marker;

  const initialRegion = {
    latitude: userLocation?.latitude || 43.238949,
    longitude: userLocation?.longitude || 76.889709,
    latitudeDelta: 0.04,
    longitudeDelta: 0.04,
  };

  return (
    <View style={{ flex: 1 }}>
      {message ? (
        <View
          style={{
            position: "absolute",
            zIndex: 10,
            top: 50,
            left: 20,
            right: 20,
            backgroundColor: "#fff",
            borderRadius: 14,
            padding: 14,
          }}
        >
          <Text style={{ fontWeight: "700" }}>{message}</Text>
        </View>
      ) : null}

      <MapView
        style={{ flex: 1 }}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton
      >
        {quests.map((quest) => {
          if (!quest.lat || !quest.lng) return null;

          return (
            <Marker
              key={quest.id}
              coordinate={{
                latitude: quest.lat,
                longitude: quest.lng,
              }}
              title={quest.title}
              description={`${quest.reward || 10} ?????`}
              onCalloutPress={() =>
                router.push(
                  `/quest/${quest.id}?title=${encodeURIComponent(
                    quest.title,
                  )}&description=${encodeURIComponent(
                    quest.description || "",
                  )}` as any,
                )
              }
            />
          );
        })}
      </MapView>

      <View
        style={{
          position: "absolute",
          bottom: 90,
          left: 20,
          right: 20,
          backgroundColor: "#fff",
          borderRadius: 18,
          padding: 14,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "800", marginBottom: 4 }}>
          Карта заданий
        </Text>
        <Text style={{ color: "#666" }}>
          Найди задания рядом и нажми на точку на карте.
        </Text>
      </View>
    </View>
  );
}
