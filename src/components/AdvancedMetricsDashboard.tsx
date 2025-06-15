
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePerformanceAnalytics } from '@/hooks/usePerformanceAnalytics';
import { useIntelligentCache } from '@/hooks/useIntelligentCache';
import { 
  Activity, 
  Zap, 
  Database, 
  Clock, 
  TrendingUp, 
  BarChart3,
  Cpu,
  HardDrive,
  RefreshCw
} from 'lucide-react';

interface AdvancedMetricsDashboardProps {
  className?: string;
}

export const AdvancedMetricsDashboard: React.FC<AdvancedMetricsDashboardProps> = ({ 
  className 
}) => {
  const { 
    metrics, 
    isRecording, 
    startRecording, 
    stopRecording, 
    getMetricsByType,
    clearMetrics 
  } = usePerformanceAnalytics();

  const cache = useIntelligentCache<any>();
  const [systemMetrics, setSystemMetrics] = useState({
    memoryUsage: 0,
    renderTime: 0,
    bundleSize: 0,
    networkRequests: 0
  });

  useEffect(() => {
    // Simular métricas del sistema
    const updateSystemMetrics = () => {
      setSystemMetrics({
        memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
        renderTime: performance.now(),
        bundleSize: metrics.length * 1024, // Simulado
        networkRequests: getMetricsByType('resource').length
      });
    };

    const interval = setInterval(updateSystemMetrics, 2000);
    return () => clearInterval(interval);
  }, [metrics, getMetricsByType]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(2)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const navigationMetrics = getMetricsByType('navigation');
  const paintMetrics = getMetricsByType('paint');
  const resourceMetrics = getMetricsByType('resource');
  const cacheStats = cache.getStats();

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Panel de Métricas Avanzadas</h2>
          <p className="text-gray-600">Monitoreo de rendimiento y análisis en tiempo real</p>
        </div>
        <div className="flex gap-2">
          {isRecording ? (
            <Button onClick={stopRecording} variant="destructive" size="sm">
              <Activity className="h-4 w-4 mr-2" />
              Detener
            </Button>
          ) : (
            <Button onClick={startRecording} size="sm">
              <Zap className="h-4 w-4 mr-2" />
              Iniciar Monitoreo
            </Button>
          )}
          <Button onClick={clearMetrics} variant="ghost" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Limpiar
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Memoria Usada</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatBytes(systemMetrics.memoryUsage)}
              </p>
            </div>
            <Cpu className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Cache Hit Rate</p>
              <p className="text-2xl font-bold text-green-600">
                {(cacheStats.hitRate * 100).toFixed(1)}%
              </p>
            </div>
            <Database className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Métricas Totales</p>
              <p className="text-2xl font-bold text-purple-600">
                {metrics.length}
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Recursos Cargados</p>
              <p className="text-2xl font-bold text-orange-600">
                {resourceMetrics.length}
              </p>
            </div>
            <HardDrive className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Rendimiento</TabsTrigger>
          <TabsTrigger value="resources">Recursos</TabsTrigger>
          <TabsTrigger value="cache">Caché</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Métricas de Navegación
              </h3>
              <div className="space-y-2">
                {navigationMetrics.map((metric, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{metric.name}</span>
                    <Badge variant="secondary">
                      {formatTime(metric.value)}
                    </Badge>
                  </div>
                ))}
                {navigationMetrics.length === 0 && (
                  <p className="text-sm text-gray-500">No hay datos disponibles</p>
                )}
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Métricas de Pintura
              </h3>
              <div className="space-y-2">
                {paintMetrics.map((metric, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{metric.name}</span>
                    <Badge variant="secondary">
                      {formatTime(metric.value)}
                    </Badge>
                  </div>
                ))}
                {paintMetrics.length === 0 && (
                  <p className="text-sm text-gray-500">No hay datos disponibles</p>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Recursos Cargados</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {resourceMetrics.slice(0, 10).map((metric, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600 truncate flex-1">
                    {metric.name.split('/').pop()}
                  </span>
                  <Badge variant="outline">
                    {formatTime(metric.value)}
                  </Badge>
                </div>
              ))}
              {resourceMetrics.length === 0 && (
                <p className="text-sm text-gray-500">No hay recursos monitoreados</p>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="cache" className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Estadísticas de Caché</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Tamaño del Caché</p>
                <p className="text-xl font-bold">{cacheStats.size}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total de Solicitudes</p>
                <p className="text-xl font-bold">{cacheStats.totalRequests}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Hits</p>
                <p className="text-xl font-bold text-green-600">{cacheStats.totalHits}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tasa de Aciertos</p>
                <p className="text-xl font-bold text-blue-600">
                  {(cacheStats.hitRate * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Métricas del Sistema</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Uso de Memoria</span>
                <span className="font-mono text-sm">
                  {formatBytes(systemMetrics.memoryUsage)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tiempo de Renderizado</span>
                <span className="font-mono text-sm">
                  {formatTime(systemMetrics.renderTime)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tamaño del Bundle</span>
                <span className="font-mono text-sm">
                  {formatBytes(systemMetrics.bundleSize)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Solicitudes de Red</span>
                <span className="font-mono text-sm">
                  {systemMetrics.networkRequests}
                </span>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {isRecording && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-700">
              Monitoreo activo - Registrando métricas en tiempo real
            </span>
          </div>
        </Card>
      )}
    </div>
  );
};
