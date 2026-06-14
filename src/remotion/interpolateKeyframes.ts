import { Easing, interpolate } from 'remotion'
import type {
  EasingType,
  Keyframe,
  KeyframeProps,
  ResolvedKeyframeProps,
} from '../utils/types'

function easingFor(type: EasingType) {
  switch (type) {
    case 'easeIn':
      return Easing.in(Easing.ease)
    case 'easeOut':
      return Easing.out(Easing.ease)
    case 'easeInOut':
      return Easing.inOut(Easing.ease)
    default:
      return Easing.linear
  }
}

function interpolateProp(
  localFrame: number,
  keyframes: Keyframe[],
  pick: (props: KeyframeProps) => number,
): number {
  if (keyframes.length === 1) {
    return pick(keyframes[0].props)
  }

  for (let index = 0; index < keyframes.length - 1; index += 1) {
    const current = keyframes[index]
    const next = keyframes[index + 1]
    if (localFrame >= current.frame && localFrame <= next.frame) {
      return interpolate(
        localFrame,
        [current.frame, next.frame],
        [pick(current.props), pick(next.props)],
        {
          easing: easingFor(next.easing),
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        },
      )
    }
  }

  if (localFrame < keyframes[0].frame) {
    return pick(keyframes[0].props)
  }
  return pick(keyframes[keyframes.length - 1].props)
}

export function resolveKeyframeProps(
  localFrame: number,
  keyframes: Keyframe[],
  fallback: ResolvedKeyframeProps,
): ResolvedKeyframeProps {
  if (keyframes.length === 0) {
    return fallback
  }
  return {
    scale: interpolateProp(localFrame, keyframes, (props) => props.scale),
    translateX: interpolateProp(localFrame, keyframes, (props) => props.translateX),
    translateY: interpolateProp(localFrame, keyframes, (props) => props.translateY),
    opacity: interpolateProp(localFrame, keyframes, (props) => props.opacity),
  }
}
