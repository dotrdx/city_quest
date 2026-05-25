import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { supabase } from "../lib/supabase";

const USER_ID = "7618c9fc-c227-498b-a06b-270b3c7cf92b";

type CompletedQuest = {
  userQuestId: string;
  id: string;
  title: string;
  description: string | null;
  created_at: string | null;
};

export default function CompletedScreen() {
  const [quests, setQuests] = useState<CompletedQuest[]>([]);

  const loadCompleted = async () => {
    const { data, error } = await supabase
      .from("user_quests")
      .select(
        `
        id,
        created_at,
        status,
        quests (
          id,
          title,
          description
        )
      `,
      )
      .eq("user_id", USER_ID)
      .eq("status", "completed")
      .order("created_at", { ascending: false });

    if (!error && data) {
      const formatted = (data || [])
        .map((row: any): CompletedQuest | null => {
          if (!row.quests) return null;

          return {
            userQuestId: row.id,
            id: row.quests.id,
            title: row.quests.title,
            description: row.quests.description ?? null,
            created_at: row.created_at ?? null,
          };
        })
        .filter((q): q is CompletedQuest => q !== null);

      setQuests(formatted);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCompleted();
    }, []),
  );

  return (
    <ScrollView
      contentContainerStyle={{
        padding: 20,
        backgroundColor: "#fff",
        flexGrow: 1,
      }}
    >
      <Text style={{ fontSize: 26, fontWeight: "700", marginBottom: 20 }}>
        Выполненные задания
      </Text>

      {quests.length === 0 ? (
        <Text style={{ color: "#444" }}>Пока нет выполненных заданий</Text>
      ) : (
        quests.map((q) => (
          <View
            key={q.userQuestId}
            style={{
              backgroundColor: "#eaf7ee",
              padding: 16,
              borderRadius: 12,
              marginBottom: 12,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: "600", flex: 1 }}>
                {q.title}
              </Text>

              <View
                style={{
                  backgroundColor: "#d4f4dd",
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 999,
                  marginLeft: 10,
                }}
              >
                <Text
                  style={{
                    color: "#1e7a34",
                    fontSize: 12,
                    fontWeight: "700",
                  }}
                >
                  ВЫПОЛНЕНО
                </Text>
              </View>
            </View>

            <Text style={{ color: "#333", marginBottom: 8 }}>
              {q.description}
            </Text>

            {q.created_at ? (
              <Text style={{ color: "#666", fontSize: 12 }}>
                Завершено: {new Date(q.created_at).toLocaleString()}
              </Text>
            ) : null}
          </View>
        ))
      )}
    </ScrollView>
  );
}
