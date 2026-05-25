import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { getCurrentUser } from "../../lib/auth";
import { supabase } from "../../lib/supabase";

type FeedPhoto = {
  id: string;
  image_url: string;
  caption: string | null;
  username: string | null;
  created_at: string;
  likes: { id: string; user_id: string }[];
};

export default function FeedScreen() {
  const [photos, setPhotos] = useState<FeedPhoto[]>([]);
  const [message, setMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { width } = useWindowDimensions();

  const contentWidth = Math.min(width - 32, 520);
  const imageHeight = Math.min(contentWidth * 0.75, 390);

  const loadFeed = async () => {
    const user = await getCurrentUser();

    if (!user) {
      router.replace("/auth" as any);
      return;
    }

    setCurrentUserId(user.id);

    const { data, error } = await supabase
      .from("photos")
      .select(
        `
        id,
        image_url,
        caption,
        username,
        created_at,
        likes (
          id,
          user_id
        )
      `,
      )
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setPhotos((data as FeedPhoto[]) || []);
  };

  const toggleLike = async (photo: FeedPhoto) => {
    setMessage("");

    const user = await getCurrentUser();

    if (!user) {
      router.replace("/auth" as any);
      return;
    }

    const existingLike = photo.likes?.find((like) => like.user_id === user.id);

    if (existingLike) {
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("id", existingLike.id);

      if (error) {
        setMessage(error.message);
        return;
      }
    } else {
      const { error } = await supabase.from("likes").insert({
        user_id: user.id,
        photo_id: photo.id,
      });

      if (error) {
        setMessage(error.message);
        return;
      }
    }

    await loadFeed();
  };

  useFocusEffect(
    useCallback(() => {
      loadFeed();
    }, []),
  );

  return (
    <ScrollView
      contentContainerStyle={{
        paddingTop: 24,
        paddingBottom: 100,
        backgroundColor: "#fafafa",
        alignItems: "center",
        flexGrow: 1,
      }}
    >
      <View style={{ width: contentWidth }}>
        <Text
          style={{
            fontSize: 32,
            fontWeight: "800",
            marginBottom: 18,
            color: "#111",
          }}
        >
          Лента
        </Text>

        {message ? (
          <Text style={{ color: "red", marginBottom: 12 }}>{message}</Text>
        ) : null}

        {photos.length === 0 ? (
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: "#eee",
            }}
          >
            <Text style={{ color: "#555", fontSize: 16 }}>Пока нет фото</Text>
          </View>
        ) : (
          photos.map((photo) => {
            const likedByMe = photo.likes?.some(
              (like) => like.user_id === currentUserId,
            );

            return (
              <View
                key={photo.id}
                style={{
                  marginBottom: 22,
                  backgroundColor: "#fff",
                  borderRadius: 18,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: "#eee",
                  shadowColor: "#000",
                  shadowOpacity: 0.05,
                  shadowRadius: 10,
                  elevation: 2,
                }}
              >
                <View
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: "#111",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 10,
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "700" }}>
                      {(photo.username || "U").charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  <View>
                    <Text style={{ fontWeight: "800", fontSize: 15 }}>
                      @{photo.username || "user"}
                    </Text>
                    <Text style={{ color: "#777", fontSize: 12 }}>
                      {new Date(photo.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                <Image
                  source={{ uri: photo.image_url }}
                  resizeMode="cover"
                  style={{
                    width: "100%",
                    height: imageHeight,
                    backgroundColor: "#eee",
                  }}
                />

                <View style={{ padding: 14 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <Pressable onPress={() => toggleLike(photo)}>
                      <Text style={{ fontSize: 30 }}>
                        {likedByMe ? "♥" : "♡"}
                      </Text>
                    </Pressable>

                    <Text
                      style={{
                        marginLeft: 10,
                        fontWeight: "700",
                        fontSize: 15,
                      }}
                    >
                      {photo.likes?.length || 0} лайков
                    </Text>
                  </View>

                  {photo.caption ? (
                    <Text
                      style={{ fontSize: 15, color: "#111", lineHeight: 21 }}
                    >
                      <Text style={{ fontWeight: "800" }}>
                        @{photo.username || "user"}{" "}
                      </Text>
                      {photo.caption}
                    </Text>
                  ) : (
                    <Text style={{ color: "#888", fontSize: 14 }}>
                      Без описания
                    </Text>
                  )}

                  <Text style={{ marginTop: 8, color: "#999", fontSize: 12 }}>
                    {new Date(photo.created_at).toLocaleString()}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}
