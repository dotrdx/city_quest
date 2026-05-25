import { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, Text, View } from "react-native";
import { supabase } from "../../lib/supabase";

type Player = {
  id: string;
  username: string;
  points: number;
};

export default function LeaderboardScreen() {
  const [players, setPlayers] = useState<Player[]>([]);

  const loadLeaderboard = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, points")
      .order("points", { ascending: false });

    if (error) {
      console.log(error.message);
      return;
    }

    setPlayers((data as Player[]) || []);
  };

  useEffect(() => {
    loadLeaderboard();
  }, []);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#f6f6f6",
      }}
    >
      <ScrollView
        style={{
          padding: 24,
        }}
      >
        <Text
          style={{
            fontSize: 34,
            fontWeight: "900",
            marginBottom: 24,
          }}
        >
          Топ игроков
        </Text>

        {players.map((player, index) => (
          <View
            key={player.id}
            style={{
              backgroundColor: "#fff",
              borderRadius: 18,
              padding: 20,
              marginBottom: 14,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 22,
                fontWeight: "800",
              }}
            >
              {index + 1}. @{player.username}
            </Text>

            <Text
              style={{
                fontSize: 22,
                fontWeight: "900",
                color: "#007aff",
              }}
            >
              {player.points} очков
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
