export const pySource = `
# -*- coding: utf-8 -*-

# -- Sheet --

# Modern Python Syntax Examples (3.9+)
from __future__ import annotations
from typing import TypeAlias
import asyncio

# --- Python 3.10+: New Union syntax with \`|\` instead of \`Union[]\`
def process_value(val: int | str | None) -> str | None:
    return str(val) if val is not None else None

# --- Python 3.10+: TypeAlias
Vector: TypeAlias = list[float]

# --- Python 3.10+: Structural Pattern Matching
def classify(command: object) -> str:
    match command:
        case {"action": "quit"}:
            return "Quitting"
        case {"action": "move", "direction": direction}:
            return f"Moving {direction}"
        case {"action": "attack", "weapon": weapon, "damage": int(dmg)} if dmg > 50:
            return f"Heavy attack with {weapon}: {dmg} damage"
        case [x, y]:
            return f"Point at ({x}, {y})"
        case str() as text:
            return f"Text command: {text!r}"
        case _:
            return "Unknown command"

# --- Python 3.10+: Parenthesized context managers
def read_files(src: str, dst: str) -> None:
    with (
        open(src, "r") as reader,
        open(dst, "w") as writer,
    ):
        writer.write(reader.read())

# --- Python 3.11+: Exception Groups and \`except*\`
async def handle_exceptions() -> None:
    try:
        async with asyncio.TaskGroup() as tg:
            tg.create_task(asyncio.sleep(0.1))
            tg.create_task(asyncio.sleep(0.2))
    except* ValueError as eg:
        print(f"ValueError group: {eg.exceptions}")
    except* TypeError as eg:
        print(f"TypeError group: {eg.exceptions}")


# --- Walrus Operator (3.8+) combined with modern type hints
data: list[int] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
if (n := len(data)) > 5:
    print(f"Large list with {n} elements")

filtered: list[int] = [y for x in data if (y := x**2) > 25]
print(f"Squares greater than 25: {filtered}")

# --- Demo runs
commands = [
    {"action": "quit"},
    {"action": "move", "direction": "north"},
    {"action": "attack", "weapon": "sword", "damage": 80},
    [3, 7],
    "hello",
    42,
]

for cmd in commands:
    print(classify(cmd))

print(process_value(42))
print(process_value(None))

# --- Python 3.12+: Type Parameter Syntax
type Point[T] = tuple[T, T]

def first[T](items: list[T]) -> T | None:
    return items[0] if items else None

print(first([10, 20, 30]))

# --- Python 3.14+: T-strings (Template Strings)
from templatelib import Template, Interpolation   # stdlib in 3.14

name = "world"
value = 42
tmpl = t"Hello, {name}! The answer is {value}."

print(f"Type : {type(tmpl)}")
print(f"Args : {tmpl.args}")

def render(template: Template) -> str:
    parts = []
    for part in template.args:
        if isinstance(part, str):
            parts.append(part)
        elif isinstance(part, Interpolation):
            parts.append(format(part.value, part.format_spec))
    return "".join(parts)

print(f"Rendered: {render(tmpl)}")

# --- Python 3.11+: Self type for fluent/builder interfaces
from typing import Self

class QueryBuilder:
    def __init__(self) -> None:
        self._filters: list[str] = []
        self._limit: int | None = None

    def filter(self, condition: str) -> Self:
        self._filters.append(condition)
        return self

    def limit(self, n: int) -> Self:
        self._limit = n
        return self

    def build(self) -> str:
        query = "SELECT * FROM table"
        if self._filters:
            query += " WHERE " + " AND ".join(self._filters)
        if self._limit is not None:
            query += f" LIMIT {self._limit}"
        return query

qb = QueryBuilder().filter("age > 18").filter("active = true").limit(10)
print(qb.build())

# --- Python 3.11+: TypeVarTuple for variadic generics
from typing import TypeVarTuple, Unpack

Ts = TypeVarTuple("Ts")

def zip_transform(*args: Unpack[Ts]) -> tuple[Unpack[Ts]]:
    """Passes through a heterogeneous tuple — type-safe variadic example."""
    return args  # type: ignore[return-value]

result = zip_transform(1, "hello", 3.14, True)
print(f"Variadic result : {result}")
print(f"Types           : {[type(v).__name__ for v in result]}")

# --- Python 3.12+: Improved f-string parsing
#     Reusing the same quote style inside f-strings is now legal.
items = ["apple", "banana", "cherry"]
summary = f"Items: {', '.join(item.upper() for item in items)}"
print(summary)

# Multi-line f-string expression (now fully supported)
matrix = [[1, 2], [3, 4], [5, 6]]
table = f"Matrix:\\n{'\\n'.join(
    f'  row {i}: {row}'
    for i, row in enumerate(matrix)
)}"
print(table)

# --- Python 3.12+: Generic classes with new \`type\` statement and \`[T]\` syntax
type Pair[T] = tuple[T, T]

class Stack[T]:
    def __init__(self) -> None:
        self._items: list[T] = []

    def push(self, item: T) -> None:
        self._items.append(item)

    def pop(self) -> T:
        if not self._items:
            raise IndexError("pop from empty stack")
        return self._items.pop()

    def __repr__(self) -> str:
        return f"Stack({self._items!r})"

s: Stack[int] = Stack()
s.push(10)
s.push(20)
s.push(30)
print(s)
print(f"Popped: {s.pop()}")
print(s)

# --- Python 3.13+: typing.TypeIs (narrowing predicate, more precise than TypeGuard)
from typing import TypeIs

def is_list_of_str(val: list[object]) -> TypeIs[list[str]]:
    return all(isinstance(v, str) for v in val)

mixed: list[object] = ["a", "b", "c"]
if is_list_of_str(mixed):
    # Type checker now narrows \`mixed\` to list[str] inside this block
    print(f"All strings, joined: {', '.join(mixed)}")

# --- Python 3.13+: typing.ReadOnly for TypedDict fields
from typing import TypedDict, ReadOnly

class Config(TypedDict):
    host: ReadOnly[str]      # immutable field — type checkers will flag writes
    port: int

cfg: Config = {"host": "localhost", "port": 8080}
print(f"Config: {cfg}")
`