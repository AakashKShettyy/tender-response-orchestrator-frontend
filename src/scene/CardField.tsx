import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { BoxGeometry, Color, InstancedMesh, Object3D } from 'three'
import { createCardMaterial } from './cardMaterial'
import { CARD_COUNT, HELD_INDEX, colorAt, newPose, poseAt, type Rgb } from './poses'
import { sceneState } from './sceneState'

interface Props {
  /** Smoothed chapter progress, shared with the other scene parts. */
  getProgress: () => number
  getTime: () => number
  getOpacity: () => number
}

/** The 96 question cards: one InstancedMesh, one draw call. */
export function CardField({ getProgress, getTime, getOpacity }: Props) {
  const mesh = useRef<InstancedMesh>(null)
  const geometry = useMemo(() => new BoxGeometry(1, 1, 0.02), [])
  const material = useMemo(() => createCardMaterial(), [])
  const dummy = useMemo(() => new Object3D(), [])
  const pose = useMemo(() => newPose(), [])
  const rgb = useMemo<Rgb>(() => [0, 0, 0], [])
  const color = useMemo(() => new Color(), [])

  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  // Give every instance a colour slot up front so instanceColor exists before the first draw.
  useEffect(() => {
    const m = mesh.current
    if (!m) return
    for (let i = 0; i < CARD_COUNT; i++) m.setColorAt(i, color.setRGB(0.4, 0.8, 1))
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [color])

  useFrame(() => {
    const m = mesh.current
    if (!m) return
    const p = getProgress()
    const t = getTime()
    dummy.rotation.order = 'YXZ'
    for (let i = 0; i < CARD_COUNT; i++) {
      poseAt(i, p, t, pose)
      dummy.position.set(pose.x, pose.y, pose.z)
      dummy.rotation.set(pose.rx, pose.ry, pose.rz)
      dummy.scale.set(pose.sx, pose.sy, 1)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
      colorAt(i, pose, p, rgb)
      m.setColorAt(i, color.setRGB(rgb[0], rgb[1], rgb[2]))
      if (i === HELD_INDEX) {
        sceneState.held.x = pose.x
        sceneState.held.y = pose.y
        sceneState.held.z = pose.z
      }
    }
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
    material.uniforms.uOpacity!.value = getOpacity()
    material.uniforms.uTime!.value = t
  })

  return <instancedMesh ref={mesh} args={[geometry, material, CARD_COUNT]} frustumCulled={false} />
}
