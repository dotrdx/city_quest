import { useEffect, useState, useCallback } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { getCurrentUser } from "../../lib/auth";
import { supabase } from "../../lib/supabase";

const MAX_ACTIVE_QUESTS = 3;

type Quest = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  reward: number;
};

export default function HomeScreen() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [infoText, setInfoText] = useState("");
  const [activeCount, setActiveCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [points, setPoints] = useState(0);

  const getUserOrRedirect = async () => {
    const user = await getCurrentUser();

    if (!user) {
      router.replace("/auth" as any);
      return null;
    }

    return user;
  };

  const loadPoints = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("points")
      .eq("id", userId)
      .single();

    setPoints(data?.points ?? 0);
  };

  const loadCounters = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_quests")
      .select("status")
      .eq("user_id", userId);

    if (!error && data) {
      setActiveCount(data.filter((q: any) => q.status === "active").length);
      setCompletedCount(
        data.filter((q: any) => q.status === "completed").length
      );
    }
  };

  const loadUserQuests = async () => {
    try {
      setErrorText("");
      setInfoText("");

      const user = await getUserOrRedirect();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_quests")
        .select(
          `
          quest_id,
          status,
          quests (
            id,
            title,
            description,
            reward
          )
        `
        )
        .eq("user_id", user.id)
        .eq("status", "active");

      if (error) {
        setErrorText(error.message);
        return;
      }

      const formatted: Quest[] =
        (data
          ?.map((row: any): Quest | null => {
            if (!row.quests) return null;

            return {
              id: row.quests.id,
              title: row.quests.title,
              description: row.quests.description ?? null,
              reward: row.quests.reward ?? 10,
              status: row.status,
            };
          })
          .filter((quest): quest is Quest => quest !== null)) || [];

      setQuests(formatted);

      if (formatted.length > 0) {
        setInfoText(`У тебя сейчас ${formatted.length} активных задания`);
      }

      await loadCounters(user.id);
      await loadPoints(user.id);
    } catch (e: any) {
      setErrorText(e?.message || "Ошибка загрузки заданий");
    }
  };

  const assignQuests = async () => {
    try {
      setLoading(true);
      setErrorText("");
      setInfoText("");

      const user = await getUserOrRedirect();
      if (!user) return;

      const { data: activeQuests, error: activeError } = await supabase
        .from("user_quests")
        .select("quest_id")
        .eq("user_id", user.id)
        .eq("status", "active");

      if (activeError) {
        setErrorText(activeError.message);
        return;
      }

      const activeNow = activeQuests?.length || 0;

      if (activeNow >= MAX_ACTIVE_QUESTS) {
        setInfoText(
          `У тебя уже есть ${MAX_ACTIVE_QUESTS} активных задания. Сначала выполни их.`
        );
        await loadUserQuests();
        return;
      }

      const { data: existingAll, error: existingError } = await supabase
        .from("user_quests")
        .select("quest_id")
        .eq("user_id", user.id);

      if (existingError) {
        setErrorText(existingError.message);
        return;
      }

      const existingIds = existingAll?.map((q) => q.quest_id) || [];
      const needCount = MAX_ACTIVE_QUESTS - activeNow;

      let query = supabase.from("quests").select("id");

      if (existingIds.length > 0) {
        query = query.not("id", "in", `(${existingIds.join(",")})`);
      }

      const { data: newQuests, error: newQuestsError } = await query.limit(
        needCount
      );

      if (newQuestsError) {
        setErrorText(newQuestsError.message);
        return;
      }

      if (!newQuests || newQuests.length === 0) {
        setInfoText("Новых заданий больше нет");
        await loadUserQuests();
        return;
      }

      const inserts = newQuests.map((q) => ({
        user_id: user.id,
        quest_id: q.id,
        status: "active",
      }));

      const { error: insertError } = await supabase
        .from("user_quests")
        .insert(inserts);

      if (insertError) {
        setErrorText(insertError.message);
        return;
      }

      setInfoText(`Выдано новых заданий: ${newQuests.length}`);
      await loadUserQuests();
    } catch (e: any) {
      setErrorText(e?.message || "Ошибка назначения заданий");
    } finally {
      setLoading(false);
    }
  };

  const openQuest = (quest: Quest) => {
    router.push(
      `/quest/${quest.id}?title=${encodeURIComponent(
        quest.title
      )}&description=${encodeURIComponent(quest.description ?? "")}` as any
    );
  };

  useEffect(() => {
    loadUserQuests();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUserQuests();
    }, [])
  );

  return (
    <ScrollView
      contentContainerStyle={{
        padding: 20,
        backgroundColor: "#ffffff",
        flexGrow: 1,
      }}
    >
      <Text
        style={{
          fontSize: 28,
          fontWeight: "700",
          color: "#000",
          marginBottom: 8,
        }}
      >
        Мои задания
      </Text>

      <Text style={{ marginBottom: 16, fontSize: 16, color: "#333" }}>
        🏆 Очки: {points}
      </Text>

      <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
        <View
          style={{
            flex: 1,
            backgroundColor: "#f5f5f5",
            padding: 14,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: "#666", fontSize: 13, marginBottom: 4 }}>
            Активных
          </Text>
          <Text style={{ fontSize: 22, fontWeight: "700" }}>
            {activeCount}
          </Text>
        </View>

        <View
          style={{
            flex: 1,
            backgroundColor: "#eaf7ee",
            padding: 14,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: "#666", fontSize: 13, marginBottom: 4 }}>
            Выполнено
          </Text>
          <Text style={{ fontSize: 22, fontWeight: "700" }}>
            {completedCount}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={() => router.push("/completed" as any)}
        style={{
          backgroundColor: "#007aff",
          padding: 10,
          borderRadius: 8,
          marginBottom: 10,
        }}
      >
        <Text style={{ color: "#fff", textAlign: "center" }}>
          Смотреть выполненные
        </Text>
      </Pressable>

      <Pressable
        onPress={assignQuests}
        style={{
          backgroundColor: "#000",
          padding: 14,
          borderRadius: 10,
          marginBottom: 16,
        }}
      >
        <Text
          style={{
            color: "#fff",
            textAlign: "center",
            fontSize: 16,
            fontWeight: "600",
          }}
        >
          {loading ? "Загрузка..." : "Получить задания"}
        </Text>
      </Pressable>

      {errorText ? (
        <Text style={{ color: "red", marginBottom: 12 }}>
          Ошибка: {errorText}
        </Text>
      ) : null}

      {infoText ? (
        <Text style={{ color: "#333", marginBottom: 16 }}>{infoText}</Text>
      ) : null}

      {quests.length === 0 ? (
        <Text style={{ color: "#000" }}>Активных заданий пока нет</Text>
      ) : (
        quests.map((quest, index) => (
          <Pressable
            key={`${quest.id}-${index}`}
            onPress={() => openQuest(quest)}
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              padding: 16,
              marginBottom: 14,
              shadowColor: "#000",
              shadowOpacity: 0.05,
              shadowRadius: 10,
              elevation: 2,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  color: "#000",
                  flex: 1,
                  marginRight: 10,
                }}
              >
                {quest.title}
              </Text>

              <View
                style={{
                  backgroundColor: "#e7f7ec",
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 999,
                }}
              >
                <Text
                  style={{
                    color: "#2ecc71",
                    fontWeight: "600",
                    fontSize: 12,
                  }}
                >
                  ACTIVE
                </Text>
              </View>
            </View>

            <Text style={{ fontSize: 15, color: "#333" }}>
              {quest.description || "Без описания"}
            </Text>

            <Text style={{ marginTop: 8, color: "#666", fontWeight: "600" }}>
              Награда: {quest.reward} очков
            </Text>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}