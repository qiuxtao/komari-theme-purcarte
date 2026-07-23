import { useState, useEffect, lazy, Suspense, useMemo } from "react";
import { liveDataToRecords } from "@/utils/RecordHelper";
import { useParams, useNavigate } from "react-router-dom";
import { useNodeData } from "@/contexts/NodeDataContext";
import { useLiveData } from "@/contexts/LiveDataContext";
import type { NodeData } from "@/types/node";
import { Button } from "@/components/ui/button";

import Instance from "./Instance";
const LoadCharts = lazy(() => import("./LoadCharts"));
import Loading from "@/components/loading";
import Flag from "@/components/sections/Flag";
import { useAppConfig } from "@/config";
import { useLocale } from "@/config/hooks";
import { Card } from "@/components/ui/card";

const InstancePage = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { nodes: staticNodes, loading: nodesLoading } = useNodeData();
  const { liveData } = useLiveData();
  const [staticNode, setStaticNode] = useState<NodeData | null>(null);
    const { enableInstanceDetail } = useAppConfig();
  const { t } = useLocale();

  const [recent, setRecent] = useState<any[]>([]);

  const chartRecords = useMemo(
    () => liveDataToRecords(uuid ?? "", recent),
    [uuid, recent]
  );

  useEffect(() => {
    if (!uuid) {
      setRecent([]);
      return;
    }
    const controller = new AbortController();
    setRecent([]);
    fetch(`/api/recent/${uuid}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (!controller.signal.aborted) {
          setRecent(data?.data ?? []);
        }
      })
      .catch((err) => {
        if (err?.name !== "AbortError") {
          console.error("Failed to fetch recent data:", err);
        }
      });
    return () => controller.abort();
  }, [uuid]);

  useEffect(() => {
    if (!uuid || !liveData || !liveData[uuid]) return;
    const data = liveData[uuid];
    setRecent((prev) => {
      const newRecord = data as any;
      if (prev.length > 0 && prev[prev.length - 1].updated_at === newRecord.updated_at) {
        return prev;
      }
      return [...prev, newRecord];
    });
  }, [liveData, uuid]);

  useEffect(() => {
    if (Array.isArray(staticNodes)) {
      const foundNode = staticNodes.find((n: NodeData) => n.uuid === uuid);
      setStaticNode(foundNode || null);
    }
  }, [staticNodes, uuid]);

  
  const stats = useMemo(() => {
    if (!staticNode || !liveData) return undefined;
    return liveData[staticNode.uuid];
  }, [staticNode, liveData]);

  const node = staticNode;
  const isOnline = stats?.online ?? false;

  
  // 分组服务器列表
  const groupedNodes = useMemo(() => {
    if (!staticNodes) return [];
    const groupsMap = new Map<string, NodeData[]>();
    const ungrouped: NodeData[] = [];

    staticNodes.forEach((n: NodeData) => {
      const g = n.group && n.group.trim() ? n.group.trim() : "";
      if (!g) {
        ungrouped.push(n);
      } else {
        if (!groupsMap.has(g)) {
          groupsMap.set(g, []);
        }
        groupsMap.get(g)!.push(n);
      }
    });

    const result: { groupName: string; nodes: NodeData[] }[] = [];
    if (ungrouped.length > 0) {
      result.push({ groupName: "", nodes: ungrouped });
    }
    groupsMap.forEach((nodes, groupName) => {
      result.push({ groupName, nodes });
    });
    return result;
  }, [staticNodes]);

  if (!node || !staticNode) {
    if (nodesLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loading text={t("instancePage.loadingNodeInfo")} />
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center h-full">
        {t("instancePage.nodeNotFound")}
      </div>
    );
  }

  if (nodesLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-6rem)]">
        <Loading text={t("instancePage.enteringNodeDetails")} />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row items-start gap-4 my-2 @container text-card-foreground">
      {/* 侧边栏：按分组展示服务器列表 (self-start 完美与右侧齐平，top-20 防跳动) */}
      <div className="hidden lg:flex w-64 xl:w-72 shrink-0 flex-col self-stretch">
        <Card className="sticky top-4 flex flex-col p-3.5 gap-3 h-[calc(100vh-2rem)] min-h-0 purcarte-blur theme-card-style overflow-hidden">
          <div className="px-1 py-0.5 text-sm font-bold text-foreground border-b border-border/40 pb-2.5 flex items-center justify-between">
            <span>{t("instancePage.serverList")}</span>
            <span className="text-xs text-muted-foreground font-normal">
              {staticNodes?.length || 0} 台
            </span>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-3 pr-2 purcarte-scrollbar">
            {groupedNodes.map((group, idx) => (
              <div key={group.groupName || `ungrouped-${idx}`} className="space-y-1">
                {group.groupName && (
                  <div className="px-2 py-0.5 text-[11px] font-semibold text-muted-foreground/75 uppercase tracking-wider">
                    {group.groupName}
                  </div>
                )}
                {group.nodes.map((n: NodeData) => {
                  const nStats = liveData?.[n.uuid];
                  const isNOnline = nStats?.online ?? false;
                  const isActive = n.uuid === uuid;
                  return (
                    <Button
                      key={n.uuid}
                      variant={isActive ? "secondary" : "ghost"}
                      size="sm"
                      className={`justify-start w-full px-2.5 h-8.5 rounded-xl text-xs transition-all ${
                        isActive
                          ? "bg-primary/15 text-primary font-semibold border border-primary/20 shadow-xs"
                          : "hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
                      }`}
                      onClick={() => navigate(`/instance/${n.uuid}`)}>
                      <div className="flex items-center gap-2 w-full overflow-hidden">
                        <Flag flag={n.region} />
                        <span className="truncate flex-1 text-left">{n.name}</span>
                        <div
                          className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors ${
                            isNOnline
                              ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]"
                              : "bg-rose-500"
                          }`}
                        />
                      </div>
                    </Button>
                  );
                })}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 min-w-0 space-y-4">
        <Card className="flex items-center justify-between p-4 text-primary purcarte-blur theme-card-style">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <Flag flag={node.region}></Flag>
              <span className="text-xl md:text-2xl font-bold text-foreground">{node.name}</span>
            </div>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-medium flex-shrink-0 ${
                isOnline
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
              }`}>
              {isOnline ? t("node.online") : t("node.offline")}
            </span>
          </div>
        </Card>

        {enableInstanceDetail && node && <Instance node={node} />}

        {/* 统一集中渲染新版 LoadCharts 图表 */}
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-96">
              <Loading text={t("chart.loading")} />
            </div>
          }>
          {staticNode && (
            <LoadCharts data={chartRecords} onRealtimeActiveChange={() => {}} />
          )}
        </Suspense>
      </div>
    </div>
  );
};

export default InstancePage;
