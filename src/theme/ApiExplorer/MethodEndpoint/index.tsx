import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import { useTypedSelector } from '@theme/ApiItem/hooks';
import TestRequestModal from '@site/src/components/TestRequestModal';

function colorForMethod(method: string) {
  switch (method.toLowerCase()) {
    case 'get': return 'primary';
    case 'post': return 'success';
    case 'delete': return 'danger';
    case 'put': return 'info';
    case 'patch': return 'warning';
    case 'head': return 'secondary';
    case 'event': return 'secondary';
    default: return undefined;
  }
}

interface MethodEndpointProps {
  method: string;
  path: string;
  context?: string;
}

export default function MethodEndpoint({ method, path, context }: MethodEndpointProps) {
  if (!ExecutionEnvironment.canUseDOM) {
    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <pre className="openapi__method-endpoint" style={{ marginBottom: 0, flex: 1 }}>
            <span className={`badge badge--${colorForMethod(method)}`}>
              {method === 'event' ? 'Webhook' : method.toUpperCase()}
            </span>{' '}
            {method !== 'event' && (
              <h2 className="openapi__method-endpoint-path">
                {path.replace(/{([a-z0-9-_]+)}/gi, ':$1')}
              </h2>
            )}
          </pre>
        </div>
        <div className="openapi__divider" />
      </>
    );
  }

  const serverValue = useTypedSelector((state: any) => state.server.value);

  let serverUrlWithVariables = '';
  const renderServerUrl = () => {
    if (context === 'callback') return '';
    if (serverValue?.variables) {
      serverUrlWithVariables = serverValue.url.replace(/\/$/, '');
      Object.keys(serverValue.variables).forEach((variable) => {
        serverUrlWithVariables = serverUrlWithVariables.replace(
          `{${variable}}`,
          serverValue.variables?.[variable].default ?? '',
        );
      });
    }
    return (
      <BrowserOnly>
        {() => serverUrlWithVariables.length
          ? serverUrlWithVariables
          : serverValue?.url ?? ''
        }
      </BrowserOnly>
    );
  };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <pre className="openapi__method-endpoint" style={{ marginBottom: 0, flex: 1 }}>
          <span className={`badge badge--${colorForMethod(method)}`}>
            {method === 'event' ? 'Webhook' : method.toUpperCase()}
          </span>{' '}
          {method !== 'event' && (
            <h2 className="openapi__method-endpoint-path">
              {renderServerUrl()}
              {path.replace(/{([a-z0-9-_]+)}/gi, ':$1')}
            </h2>
          )}
        </pre>
        <TestRequestModal method={method} path={path} />
      </div>
      <div className="openapi__divider" />
    </>
  );
}
