import { LABELS, registerLabel } from './labels'

/** The caption elements. They start invisible; `updateLabels` positions and fades them from the 3D scene each frame. */
export function SceneLabels() {
  return (
    <div className="scene-labels">
      {LABELS.map((label) => (
        <div key={label.id} ref={(el) => registerLabel(label.id, el)} className="scene-label" data-tone={label.tone}>
          <span className="scene-label__dot" />
          {label.text}
        </div>
      ))}
    </div>
  )
}
