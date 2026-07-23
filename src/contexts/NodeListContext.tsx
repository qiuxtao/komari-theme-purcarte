import { useNodeData } from "@/contexts/NodeDataContext";
export const useNodeList = () => { const { nodes } = useNodeData(); return { nodeList: nodes }; };