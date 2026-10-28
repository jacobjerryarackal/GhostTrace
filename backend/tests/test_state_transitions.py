"""Tests for state transition validation rules."""

import pytest
from app.models import MemoryStatus, TrustLevel
from app.trust_engine import TrustEngine, InvalidStateTransitionError


def test_valid_evidence_transitions():
    """Verify allowable evidence status transitions."""
    # TRUSTED -> QUARANTINED
    TrustEngine.validate_evidence_transition(TrustLevel.TRUSTED, TrustLevel.QUARANTINED)
    # TRUSTED -> REVOKED
    TrustEngine.validate_evidence_transition(TrustLevel.TRUSTED, TrustLevel.REVOKED)
    # QUARANTINED -> REVOKED
    TrustEngine.validate_evidence_transition(TrustLevel.QUARANTINED, TrustLevel.REVOKED)


def test_invalid_evidence_transitions():
    """Verify forbidden evidence status transitions."""
    # REVOKED cannot transition to TRUSTED
    with pytest.raises(InvalidStateTransitionError):
        TrustEngine.validate_evidence_transition(TrustLevel.REVOKED, TrustLevel.TRUSTED)

    # REVOKED cannot transition to QUARANTINED
    with pytest.raises(InvalidStateTransitionError):
        TrustEngine.validate_evidence_transition(TrustLevel.REVOKED, TrustLevel.QUARANTINED)

    # QUARANTINED cannot directly jump to TRUSTED without re-verification
    with pytest.raises(InvalidStateTransitionError):
        TrustEngine.validate_evidence_transition(TrustLevel.QUARANTINED, TrustLevel.TRUSTED)


def test_valid_memory_transitions():
    """Verify allowable memory status transitions."""
    TrustEngine.validate_memory_transition(MemoryStatus.TRUSTED, MemoryStatus.QUARANTINED)
    TrustEngine.validate_memory_transition(MemoryStatus.TRUSTED, MemoryStatus.INVALIDATED)
    TrustEngine.validate_memory_transition(MemoryStatus.QUARANTINED, MemoryStatus.INVALIDATED)
    TrustEngine.validate_memory_transition(MemoryStatus.QUARANTINED, MemoryStatus.REVOKED)


def test_invalid_memory_transitions():
    """Verify forbidden memory status transitions."""
    # INVALIDATED is terminal
    with pytest.raises(InvalidStateTransitionError):
        TrustEngine.validate_memory_transition(MemoryStatus.INVALIDATED, MemoryStatus.TRUSTED)

    with pytest.raises(InvalidStateTransitionError):
        TrustEngine.validate_memory_transition(MemoryStatus.INVALIDATED, MemoryStatus.QUARANTINED)

    # REVOKED is terminal
    with pytest.raises(InvalidStateTransitionError):
        TrustEngine.validate_memory_transition(MemoryStatus.REVOKED, MemoryStatus.TRUSTED)

