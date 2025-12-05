# RL Simulator - Paradigm Documentation

## Overview

This interactive Reinforcement Learning (RL) simulator demonstrates various RL algorithms and their underlying paradigms. Understanding the paradigm distinction is crucial for selecting the right algorithm for your problem and understanding how different algorithms relate to each other.

## RL Paradigms

### 1. Value-Based Methods

**What they learn:** Q-values `Q(s,a)` - the expected cumulative reward for taking action `a` in state `s`.

**How they derive policy:** 
- **Deterministic:** `π(s) = argmax_a Q(s,a)` (greedy policy)
- **Stochastic:** Epsilon-greedy or softmax over Q-values

**Key insight:** Value-based methods don't directly model the policy. Instead, they learn the value of state-action pairs and derive the policy by selecting the action with the highest value.

**Algorithms in this simulator:**
- **Q-Learning** (Off-Policy): Learns optimal Q-values using the max Q-value of the next state
- **DQN** (Off-Policy): Deep Q-Network - Q-Learning with neural network function approximation
- **SARSA** (On-Policy): Learns Q-values using the actual next action taken (on-policy)
- **Expected SARSA** (On-Policy): Uses the expected Q-value over the policy distribution

**On-Policy vs Off-Policy:**
- **Off-Policy:** Can learn optimal policy while following a different (e.g., exploratory) policy
- **On-Policy:** Must follow the policy being learned (e.g., epsilon-greedy)

### 2. Policy-Based Methods

**What they learn:** Policy probabilities `π(a|s)` - the probability of taking action `a` in state `s`.

**How they work:** Directly optimize the policy parameters to maximize expected return.

**Key insight:** Policy-based methods learn the policy directly without learning value functions. They're useful for:
- Continuous action spaces
- Stochastic policies
- When the policy structure is simpler than the value function

**Algorithms in this simulator:**
- **REINFORCE**: Policy gradient method using Monte Carlo returns
- **PPO** (Proximal Policy Optimization): Policy gradient with clipped objective for stability

### 3. Actor-Critic Methods

**What they learn:** Both policy `π(a|s)` (actor) and value function `V(s)` or `Q(s,a)` (critic).

**How they work:** The actor learns the policy while the critic evaluates it, providing a learning signal.

**Key insight:** Combines benefits of both value-based and policy-based methods:
- Actor: Direct policy optimization (like policy-based)
- Critic: Value function reduces variance (like value-based)

**Algorithms in this simulator:**
- **A3C** (On-Policy): Asynchronous Advantage Actor-Critic
- **SAC** (Off-Policy): Soft Actor-Critic for continuous actions
- **DDPG** (Off-Policy): Deep Deterministic Policy Gradient
- **TD3** (Off-Policy): Twin Delayed DDPG

## Paradigm Transitions

### Value-Based → Policy-Based

**Feasibility:** ✅ **Possible** - Q-values can be converted to a policy

**Transformation:**
```
π(a|s) = softmax(Q(s,a) / τ)
```

Where `τ` (temperature) controls the sharpness:
- **Low τ** (e.g., 0.1): More deterministic, closer to argmax
- **High τ** (e.g., 5.0): More uniform distribution

**What changes:**
1. **Representation:** Q-values → Policy probabilities
2. **Action selection:** Argmax → Sampling from distribution
3. **Visualization:** 
   - Q-values show expected returns
   - Policy probabilities show action likelihoods
4. **Behavior:** Deterministic → Stochastic

**Use case:** When you want to convert a learned Q-function into a stochastic policy for exploration or robustness.

**Implementation in simulator:**
- Available for all value-based methods (Q-Learning, DQN, SARSA, Expected SARSA)
- Use the "Transform to Policy Network" button
- Adjust temperature to control policy sharpness
- Animated transition shows Q-values morphing into probabilities

### Policy-Based → Value-Based

**Feasibility:** ❌ **Not directly possible** - Policy doesn't contain value information

**Why not:** Policy-based methods learn `π(a|s)` but don't learn `Q(s,a)` or `V(s)`. To get values, you would need to:
1. Estimate value function separately (e.g., using Monte Carlo or TD learning)
2. Use the policy to generate trajectories and compute returns
3. This would essentially require implementing a separate value function estimator

**Alternative:** Actor-Critic methods already have both components.

### Value-Based ↔ Actor-Critic

**Feasibility:** ⚠️ **Partial** - Can extract components

**From Actor-Critic:**
- ✅ Can extract policy (actor) - already available
- ✅ Can extract value function (critic) - already available
- ❌ Cannot directly convert to pure value-based (would lose policy component)

**To Actor-Critic:**
- ❌ Cannot convert pure value-based to actor-critic (would need to add policy network)
- However, you can think of value-based methods as having an implicit policy (argmax)

### Policy-Based ↔ Actor-Critic

**Feasibility:** ⚠️ **Partial** - Can extract components

**From Actor-Critic:**
- ✅ Can extract policy (actor) - this is the policy-based component
- ✅ Can extract value function (critic) - this is the value-based component

**To Actor-Critic:**
- ❌ Cannot convert pure policy-based to actor-critic (would need to add value function estimator)

## Algorithm-to-Algorithm Transitions

### Within Same Paradigm

**Value-Based ↔ Value-Based:**
- ✅ **Possible** - All learn Q-values
- Can switch between Q-Learning, DQN, SARSA, Expected SARSA
- Q-values may need re-initialization or can be transferred (with caution)
- **Note:** On-policy vs off-policy distinction matters for learning updates

**Policy-Based ↔ Policy-Based:**
- ⚠️ **Possible but limited** - Both learn policies but:
  - Network architectures may differ
  - Policy parameters are not directly transferable
  - Would need to re-train

**Actor-Critic ↔ Actor-Critic:**
- ⚠️ **Possible but limited** - Similar to policy-based
  - Can extract and potentially transfer actor or critic separately
  - Full transfer requires compatible architectures

### Cross-Paradigm Transitions

**Value-Based → Policy-Based:**
- ✅ **Possible** - Use softmax transformation (see above)
- Implemented in simulator with animated transition

**Policy-Based → Value-Based:**
- ❌ **Not directly possible** - Would need value function estimation

**Value-Based → Actor-Critic:**
- ❌ **Not directly possible** - Would need to add policy network

**Policy-Based → Actor-Critic:**
- ❌ **Not directly possible** - Would need to add value function estimator

**Actor-Critic → Value-Based:**
- ⚠️ **Partial** - Can use critic (Q-function) as value-based method
- Would ignore actor component

**Actor-Critic → Policy-Based:**
- ⚠️ **Partial** - Can use actor as policy-based method
- Would ignore critic component

## Transition Feasibility Matrix

| From → To | Value-Based | Policy-Based | Actor-Critic |
|-----------|-------------|--------------|--------------|
| **Value-Based** | ✅ Easy | ✅ Via softmax | ❌ No |
| **Policy-Based** | ❌ No | ⚠️ Limited | ❌ No |
| **Actor-Critic** | ⚠️ Extract critic | ⚠️ Extract actor | ⚠️ Limited |

## Technical Implementation Details

### Policy Transformation Formula

For value-based methods, converting Q-values to policy probabilities:

```typescript
// Softmax with temperature
function softmax(qValues: number[], temperature: number): number[] {
  const scaled = qValues.map(q => q / temperature);
  const maxScaled = Math.max(...scaled);
  const expValues = scaled.map(q => Math.exp(q - maxScaled));
  const sum = expValues.reduce((a, b) => a + b, 0);
  return expValues.map(exp => exp / sum);
}
```

**Temperature effects:**
- `τ → 0`: Approaches argmax (deterministic)
- `τ = 1`: Standard softmax
- `τ → ∞`: Uniform distribution

### Action Selection Comparison

**Value-Based (Argmax):**
```typescript
action = argmax_a Q(s, a)  // Deterministic
```

**Value-Based (Epsilon-Greedy):**
```typescript
if (random() < epsilon) {
  action = random_action()  // Exploration
} else {
  action = argmax_a Q(s, a)  // Exploitation
}
```

**Policy-Based (Sampling):**
```typescript
action ~ π(a|s)  // Sample from probability distribution
```

**Transformed Value-Based (Softmax):**
```typescript
π(a|s) = softmax(Q(s,a) / τ)
action ~ π(a|s)  // Sample from transformed policy
```

## Usage Guide

### Using Policy Transformation

1. **Select a value-based algorithm** (Q-Learning, DQN, SARSA, or Expected SARSA)
2. **Select GridWorld environment** (policy transformation currently available for GridWorld)
3. **Train the algorithm** to learn Q-values
4. **Click "Transform to Policy Network"** to see the conversion
5. **Adjust temperature** to control policy sharpness:
   - Lower values → more deterministic (closer to argmax)
   - Higher values → more uniform distribution
6. **Observe the animation** showing Q-values morphing into probabilities

### Understanding the Visualization

**Q-Value View:**
- Shows `Q(s,a)` for each action in each state
- Arrow indicates best action (argmax)
- Numbers show expected cumulative reward

**Policy View:**
- Shows `π(a|s)` probabilities for each action
- Arrow thickness/opacity represents probability
- Numbers show action probabilities (sum to 1.0)

**Transition Animation:**
- Smoothly interpolates between Q-values and probabilities
- Visualizes the softmax transformation
- Shows how deterministic selection becomes stochastic

## Key Takeaways

1. **Value-based methods learn Q-values, not policies directly**
   - Policy is derived via argmax or epsilon-greedy
   - Can be converted to stochastic policy via softmax

2. **Policy-based methods learn policies directly**
   - No value function needed
   - Cannot be directly converted to value-based

3. **Actor-Critic combines both**
   - Can extract either component
   - Most flexible paradigm

4. **Transitions are not always symmetric**
   - Value → Policy: ✅ Possible
   - Policy → Value: ❌ Not directly possible

5. **Temperature parameter controls exploration**
   - Lower temperature = more exploitation (deterministic)
   - Higher temperature = more exploration (stochastic)

## References

- Sutton & Barto, "Reinforcement Learning: An Introduction" (2018)
- Policy Gradient Methods: REINFORCE, PPO
- Value Function Methods: Q-Learning, SARSA, DQN
- Actor-Critic Methods: A3C, DDPG, SAC, TD3

---

**Last Updated:** December 2025

