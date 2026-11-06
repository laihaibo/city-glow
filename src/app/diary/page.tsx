"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DiaryTab } from "@/components/diary/diary-tab";
import { KnowledgeTab } from "@/components/diary/knowledge-tab";

export default function DiaryPage() {
  const [tab, setTab] = useState("diary");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight">探索日记</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          每次出走都值得记下，时间线会攒成孩子的成长档案
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="glass grid w-full grid-cols-2 rounded-2xl">
          <TabsTrigger value="diary" className="rounded-xl">
            📝 日记
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="rounded-xl">
            🏷️ 知识卡片
          </TabsTrigger>
        </TabsList>
        <TabsContent value="diary" className="mt-4">
          <DiaryTab />
        </TabsContent>
        <TabsContent value="knowledge" className="mt-4">
          <KnowledgeTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
