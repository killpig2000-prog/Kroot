export type Situation = {
  key: string;
  label: string;
  krLabel: string;
  icon: string;
  bg: string;
  photoQuery: string;
};

export const SITUATIONS: Situation[] = [
  { key: "cafe", label: "Cafe", krLabel: "카페", icon: "☕", bg: "#FFD66B", photoQuery: "korean cafe latte barista" },
  { key: "restaurant", label: "Restaurant", krLabel: "식당", icon: "🍽️", bg: "#FF9E7D", photoQuery: "korean food restaurant dining" },
  { key: "airport", label: "Airport", krLabel: "공항", icon: "✈️", bg: "#8FCBDF", photoQuery: "airport departure terminal airplane" },
  { key: "shopping", label: "Shopping", krLabel: "쇼핑", icon: "🛍️", bg: "#F2A0B9", photoQuery: "seoul shopping street stores" },
  { key: "directions", label: "Directions", krLabel: "길찾기", icon: "🗺️", bg: "#B7A6E3", photoQuery: "seoul city street crosswalk" },
  { key: "hospital", label: "Hospital", krLabel: "병원", icon: "🏥", bg: "#94B8E3", photoQuery: "hospital corridor doctor" },
  { key: "hotel", label: "Hotel", krLabel: "호텔", icon: "🏨", bg: "#6BBF8A", photoQuery: "hotel reception check in desk" },
  { key: "phone", label: "Phone Call", krLabel: "전화", icon: "📞", bg: "#FFB4A2", photoQuery: "person talking smartphone call" },
];

export function situationByKey(key: string) {
  return SITUATIONS.find((s) => s.key === key);
}
