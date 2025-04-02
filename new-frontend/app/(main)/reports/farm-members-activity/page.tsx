"use client";

import React, { useEffect, useState } from "react";
import { Card } from "primereact/card";
import { ProgressSpinner } from "primereact/progressspinner";
import { Dropdown } from "primereact/dropdown";
import ProtectedRoute from "@/utils/ProtectedRoute";
import api from "@/utils/api";
import { toast } from "sonner";

const FarmMembersActivityReport = () => {
  const [loading, setLoading] = useState(true);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [seasonOptions, setSeasonOptions] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);

  useEffect(() => {
    fetchSeasons();
  }, []);

  const fetchSeasons = async () => {
    try {
      const res = await api.get("/seasons");
      const options = res.data.map((s: any) => ({
        label: s.name,
        value: s.id,
      }));
      setSeasonOptions(options);
      if (options.length > 0) {
        setSelectedSeason(options[0].value);
      }
    } catch {
      toast.error("Failed to load seasons");
    }
  };

  useEffect(() => {
    if (!selectedSeason) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await api.get("/report/farm-members-activity", {
          headers: {
            seasonid: selectedSeason,
          },
        });
        setActivityData(res.data);
      } catch {
        toast.error("Failed to load activity report");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedSeason]);

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-6">
        <Card title="Farm Members Activity Report">
          <div className="mb-4">
            <Dropdown
              value={selectedSeason}
              options={seasonOptions}
              onChange={(e) => setSelectedSeason(e.value)}
              placeholder="Select Season"
              className="w-72"
            />
          </div>

          {loading ? (
            <div className="flex justify-center p-10">
              <ProgressSpinner />
            </div>
          ) : activityData.length === 0 ? (
            <p className="text-gray-500">No activity data found for this season.</p>
          ) : (
            activityData.map((member) => (
              <Card key={member.id} title={member.username} className="mb-4">
                <p><strong>Role:</strong> {member.role}</p>
                <p><strong>Tasks Participated:</strong> {member.taskCount}</p>
                <p><strong>Total Minutes Worked:</strong> {member.totalMinutes}</p>
                {member.taskTitles.length > 0 && (
                  <>
                    <p className="mt-2 font-semibold">Tasks:</p>
                    <ul className="list-disc ml-6 mt-1">
                      {member.taskTitles.map((title: string, index: number) => (
                        <li key={index}>{title}</li>
                      ))}
                    </ul>
                  </>
                )}
              </Card>
            ))
          )}
        </Card>
      </div>
    </ProtectedRoute>
  );
};

export default FarmMembersActivityReport;
