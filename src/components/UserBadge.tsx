"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/UI";

interface UserBadgeProps {
  userId: string;
  userName: string;
  showClass?: boolean;
}

interface PartyInfo {
  politicalStatus: string;
  className: string;
  showPoliticalStatus: boolean;
  showClassName: boolean;
}

export default function UserBadge({ userId, userName, showClass = true }: UserBadgeProps) {
  const [partyInfo, setPartyInfo] = useState<PartyInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPartyInfo();
  }, [userId]);

  const loadPartyInfo = async () => {
    try {
      const res = await fetch(`/api/party-info/public?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setPartyInfo(data);
      }
    } catch (error) {
      console.error("加载党务信息失败", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "党员":
        return "bg-red-50 text-red-700 border border-red-200";
      case "预备党员":
        return "bg-orange-50 text-orange-700 border border-orange-200";
      case "入党积极分子":
        return "bg-yellow-50 text-yellow-700 border border-yellow-200";
      case "共青团员":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      default:
        return "bg-gray-50 text-gray-700 border border-gray-200";
    }
  };

  if (loading || !partyInfo) {
    return <span className="font-medium text-gray-900">{userName}</span>;
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="font-medium text-gray-900">{userName}</span>
      {partyInfo.showPoliticalStatus && (
        <Badge className={`${getStatusColor(partyInfo.politicalStatus)} text-xs px-2 py-0.5`}>
          {partyInfo.politicalStatus}
        </Badge>
      )}
      {showClass && partyInfo.showClassName && partyInfo.className && (
        <Badge className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5">
          {partyInfo.className}
        </Badge>
      )}
    </div>
  );
}
