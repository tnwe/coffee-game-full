from pydantic import BaseModel

class PlayerBase(BaseModel):
    name: str
    has_immunity: bool = False

class PlayerCreate(PlayerBase):
    pass

class Player(PlayerBase):
    id: int

    class Config:
        orm_mode = True

class PlayerUpdate(BaseModel):
    has_immunity: bool = None
