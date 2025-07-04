"""Add podcast_id to conversation

Revision ID: 9a8d6faa23ec
Revises: 192a4e7dcafb
Create Date: 2025-06-20 11:48:37.401611

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision: str = '9a8d6faa23ec'
down_revision: Union[str, None] = '192a4e7dcafb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('conversation', schema=None) as batch_op:
        batch_op.add_column(sa.Column('podcast_id', sa.Uuid(), nullable=True))
        batch_op.create_foreign_key(None, 'podcast', ['podcast_id'], ['id'])

    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('conversation', schema=None) as batch_op:
        batch_op.drop_constraint(None, type_='foreignkey')
        batch_op.drop_column('podcast_id')

    # ### end Alembic commands ###
