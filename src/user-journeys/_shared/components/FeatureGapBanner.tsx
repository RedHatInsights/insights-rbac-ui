import React from 'react';

export interface FeatureGap {
  /** Title/summary of the gap */
  title: string;
  /** Design file reference (path or URL) */
  designRef?: string;
  /** Design image URL or import path */
  designImage?: string;
  /** Current state description */
  currentState: string;
  /** Expected behavior per design */
  expectedBehavior: string | string[];
  /** Implementation steps required */
  implementation?: string[];
  /** Related files in the codebase */
  relatedFiles?: string[];
}

interface FeatureGapBannerProps {
  gap: FeatureGap;
  /** Initial collapsed state - defaults to false (expanded) */
  defaultCollapsed?: boolean;
}

/**
 * PostIt-style banner component to display feature gap information.
 * Positioned fixed at bottom-left corner for visibility without blocking content.
 */
export const FeatureGapBanner: React.FC<FeatureGapBannerProps> = ({ gap, defaultCollapsed = false }) => {
  const [isExpanded, setIsExpanded] = React.useState(!defaultCollapsed);
  const [isDismissed, setIsDismissed] = React.useState(false);
  const [showImageModal, setShowImageModal] = React.useState(false);

  if (isDismissed) return null;

  const postItStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '20px',
    left: '20px',
    zIndex: 9999,
    width: isExpanded ? '420px' : '200px',
    maxHeight: isExpanded ? '80vh' : 'auto',
    backgroundColor: '#fff9c4', // Yellow PostIt color
    borderRadius: '2px',
    boxShadow: '4px 4px 12px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05)',
    fontFamily: "'Patrick Hand', 'Comic Sans MS', cursive, sans-serif",
    transform: 'rotate(-1deg)',
    transition: 'all 0.2s ease',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  };

  const headerStyle: React.CSSProperties = {
    padding: '12px 16px',
    borderBottom: isExpanded ? '1px dashed #e0d654' : 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    flexShrink: 0,
  };

  const titleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#5d4037',
    lineHeight: 1.3,
  };

  const contentStyle: React.CSSProperties = {
    padding: '12px 16px',
    fontSize: '12px',
    color: '#5d4037',
    overflowY: 'auto',
    flex: 1,
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: '12px',
  };

  const labelStyle: React.CSSProperties = {
    fontWeight: 'bold',
    fontSize: '11px',
    textTransform: 'uppercase',
    color: '#8d6e63',
    marginBottom: '4px',
  };

  const listStyle: React.CSSProperties = {
    margin: '4px 0',
    paddingLeft: '16px',
  };

  const codeStyle: React.CSSProperties = {
    backgroundColor: 'rgba(0,0,0,0.08)',
    padding: '1px 4px',
    borderRadius: '2px',
    fontFamily: 'monospace',
    fontSize: '10px',
  };

  const buttonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    color: '#8d6e63',
    fontSize: '16px',
    lineHeight: 1,
  };

  const imageContainerStyle: React.CSSProperties = {
    marginTop: '8px',
    border: '1px solid #e0d654',
    borderRadius: '4px',
    overflow: 'hidden',
    position: 'relative',
    cursor: 'pointer',
  };

  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: 'auto',
    display: 'block',
  };

  const imageOverlayStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '4px',
    right: '4px',
    background: 'rgba(0,0,0,0.6)',
    color: 'white',
    padding: '2px 8px',
    borderRadius: '3px',
    fontSize: '10px',
    display: 'flex',
    gap: '8px',
  };

  const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    zIndex: 10000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  };

  const modalImageStyle: React.CSSProperties = {
    maxWidth: '90vw',
    maxHeight: '90vh',
    objectFit: 'contain',
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
  };

  const openInNewTab = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (gap.designImage) {
      window.open(gap.designImage, '_blank');
    }
  };

  return (
    <>
      <div style={postItStyle} data-testid="feature-gap-banner">
        <div style={headerStyle} onClick={() => setIsExpanded(!isExpanded)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: '16px' }}>⚠️</span>
            <h4
              style={{
                ...titleStyle,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: isExpanded ? 'normal' : 'nowrap',
              }}
            >
              {gap.title}
            </h4>
          </div>
          <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
            <span style={{ ...buttonStyle, transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
            <button
              style={buttonStyle}
              onClick={(e) => {
                e.stopPropagation();
                setIsDismissed(true);
              }}
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>

        {isExpanded && (
          <div style={contentStyle}>
            {gap.designRef && (
              <div style={sectionStyle}>
                <div style={labelStyle}>📎 Design Reference</div>
                <code style={codeStyle}>{gap.designRef}</code>
              </div>
            )}

            {gap.designImage && (
              <div style={sectionStyle}>
                <div style={labelStyle}>🖼️ Design</div>
                <div style={imageContainerStyle} onClick={() => setShowImageModal(true)}>
                  <img src={gap.designImage} alt={`Design: ${gap.title}`} style={imageStyle} />
                  <div style={imageOverlayStyle}>
                    <span onClick={() => setShowImageModal(true)}>🔍 Expand</span>
                    <span onClick={openInNewTab}>↗ New Tab</span>
                  </div>
                </div>
              </div>
            )}

            <div style={sectionStyle}>
              <div style={labelStyle}>📍 Current State</div>
              <p style={{ margin: 0 }}>{gap.currentState}</p>
            </div>

            <div style={sectionStyle}>
              <div style={labelStyle}>✨ Expected Behavior</div>
              {Array.isArray(gap.expectedBehavior) ? (
                <ul style={listStyle}>
                  {gap.expectedBehavior.map((item, i) => (
                    <li key={i} style={{ marginBottom: '2px' }}>
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ margin: 0 }}>{gap.expectedBehavior}</p>
              )}
            </div>

            {gap.implementation && gap.implementation.length > 0 && (
              <div style={sectionStyle}>
                <div style={labelStyle}>🔧 To Implement</div>
                <ol style={{ ...listStyle, paddingLeft: '20px' }}>
                  {gap.implementation.map((step, i) => (
                    <li key={i} style={{ marginBottom: '2px' }}>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {gap.relatedFiles && gap.relatedFiles.length > 0 && (
              <div style={{ ...sectionStyle, marginBottom: 0 }}>
                <div style={labelStyle}>📁 Related Files</div>
                <ul style={{ ...listStyle, listStyle: 'none', paddingLeft: '4px' }}>
                  {gap.relatedFiles.map((file, i) => (
                    <li key={i} style={{ marginBottom: '2px' }}>
                      <code style={codeStyle}>{file}</code>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image Modal */}
      {showImageModal && gap.designImage && (
        <div style={modalOverlayStyle} onClick={() => setShowImageModal(false)}>
          <img src={gap.designImage} alt={`Design: ${gap.title}`} style={modalImageStyle} onClick={(e) => e.stopPropagation()} />
          <div
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              display: 'flex',
              gap: '12px',
            }}
          >
            <button
              style={{
                background: 'rgba(255,255,255,0.9)',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
              onClick={openInNewTab}
            >
              ↗ Open in New Tab
            </button>
            <button
              style={{
                background: 'rgba(255,255,255,0.9)',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
              onClick={() => setShowImageModal(false)}
            >
              ✕ Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

/**
 * Decorator to add a feature gap PostIt to a story.
 * Usage in story:
 *
 * export const MyGapStory: Story = {
 *   decorators: [withFeatureGap({
 *     title: 'Workspaces column data',
 *     designRef: 'General auditing - roles in V2.png',
 *     designImage: '/path/to/design.png', // or import the image
 *     currentState: 'Column shows empty strings',
 *     expectedBehavior: 'Should show workspace count per role',
 *     implementation: ['Add workspaces field', 'Update cell renderer'],
 *     relatedFiles: ['src/features/roles/RolesWithWorkspaces.tsx']
 *   })],
 * };
 */
export const withFeatureGap = (gap: FeatureGap, options?: { defaultCollapsed?: boolean }) => {
  const FeatureGapDecorator = (Story: React.ComponentType) => (
    <>
      <Story />
      <FeatureGapBanner gap={gap} defaultCollapsed={options?.defaultCollapsed ?? false} />
    </>
  );
  FeatureGapDecorator.displayName = `withFeatureGap(${gap.title})`;
  return FeatureGapDecorator;
};

export default FeatureGapBanner;
