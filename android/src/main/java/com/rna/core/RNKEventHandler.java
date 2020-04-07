package com.rna.core;

@FunctionalInterface
public interface RNKEventHandler {
    boolean execute(Object data);
}