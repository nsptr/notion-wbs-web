export interface ProjectConfig {
  showFromToday?: boolean;
  titleOverride?: string;
}

const config: Record<string, ProjectConfig> = {
  "36dc5c73-c588-807c-84bd-e0286ec83944": {
    showFromToday: false,
    titleOverride: "2026 3차원 자동제작 효율화 사업",
  },
  "63af2bb870464cf6bfb4c3546538f100": {
    showFromToday: true,
  },
};

export function getProjectConfig(id: string): ProjectConfig {
  return config[id] ?? {};
}
