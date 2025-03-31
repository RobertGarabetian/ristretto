import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApi, User, Visit } from "../../lib/api";
import { useClerk, useUser } from "@clerk/clerk-expo";
import { useIsFocused } from "@react-navigation/native";

export default function ProfileScreen() {
  const { isSignedIn, user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const api = useApi();
  const isFocused = useIsFocused();
  const [profile, setProfile] = useState();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [visitsLoading, setVisitsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user profile and visits when screen is focused
  useEffect(() => {
    if (isFocused && isSignedIn) {
      fetchUserProfile();
      fetchVisits();
    }
  }, [isFocused, isSignedIn]);

  // Function to fetch user profile
  const fetchUserProfile = async () => {
    setLoading(true);
    setError(null);

    try {
      const userData = await api.getUserProfile();
      setUser(userData);
    } catch (err) {
      console.error("Error fetching user profile:", err);
      setError("Failed to fetch user profile");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Function to fetch visits
  const fetchVisits = async () => {
    setVisitsLoading(true);

    try {
      const visitsData = await api.getVisits();
      setVisits(visitsData);
    } catch (err) {
      console.error("Error fetching visits:", err);
    } finally {
      setVisitsLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchUserProfile();
    fetchVisits();
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error("Error signing out:", err);
      Alert.alert("Error", "Failed to sign out");
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Render a visit item
  const renderVisitItem = ({ item }: { item: Visit }) => (
    <View style={styles.visitItem}>
      <View>
        <Text style={styles.visitName}>{item.name}</Text>
        <Text style={styles.visitDate}>{formatDate(item.visitedAt)}</Text>
      </View>
      <Ionicons name="checkmark-circle" size={20} color="#10b981" />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#6b7280" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchUserProfile}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {user && (
        <>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {user.firstName.charAt(0)}
                {user.lastName.charAt(0)}
              </Text>
            </View>
            <Text style={styles.userName}>
              {user.firstName} {user.lastName}
            </Text>
            <Text style={styles.userEmail}>{user.email}</Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{visits.length}</Text>
              <Text style={styles.statLabel}>Visits</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {new Set(visits.map((v) => v.placeId)).size}
              </Text>
              <Text style={styles.statLabel}>Places</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {visits.length > 0
                  ? formatDate(visits[0].visitedAt).split(",")[0]
                  : "-"}
              </Text>
              <Text style={styles.statLabel}>Last Visit</Text>
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Recent Visits</Text>

            {visitsLoading ? (
              <ActivityIndicator
                size="small"
                color="#3b82f6"
                style={styles.visitsLoading}
              />
            ) : visits.length > 0 ? (
              <FlatList
                data={visits.slice(0, 5)}
                renderItem={renderVisitItem}
                keyExtractor={(item, index) => `${item.placeId}-${index}`}
                scrollEnabled={false}
              />
            ) : (
              <Text style={styles.noVisitsText}>No visits recorded yet</Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: "#f5f5f5",
  },
  errorText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "600",
    color: "#fff",
  },
  userName: {
    fontSize: 24,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: "#6b7280",
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#e5e7eb",
    marginHorizontal: 8,
  },
  sectionContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  visitItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  visitName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
    marginBottom: 4,
  },
  visitDate: {
    fontSize: 14,
    color: "#6b7280",
  },
  visitsLoading: {
    paddingVertical: 24,
  },
  noVisitsText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    paddingVertical: 24,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  signOutText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
    color: "#ef4444",
  },
});
